import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { getSocket, connectSocket } from "../services/socketService";
import { getResolvedRTCConfig } from "../utils/webrtcConfig";
import CallModal from "../components/chat/CallModal";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import { createVirtualVideoStream } from "../utils/virtualStream";

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};

// ── WhatsApp-grade SDP enhancer: enables Opus stereo, 64kbps HD audio, FEC, DTX ──
const optimizeSdp = (sdp) => {
  if (!sdp) return sdp;
  let s = sdp;
  s = s.replace(/a=fmtp:(\d+) (.*)/g, (match, pt, params) => {
    if (params.includes("useinbandfec")) return match;
    if (s.includes(`a=rtpmap:${pt} opus/48000`)) {
      return `a=fmtp:${pt} ${params};stereo=1;sprop-stereo=1;useinbandfec=1;usedtx=1;maxaveragebitrate=64000`;
    }
    return match;
  });
  return s;
};

export const CallProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  const [localStream, setLocalStream]       = useState(null);
  const [remoteStream, setRemoteStream]     = useState(null);
  const [screenStream, setScreenStream]     = useState(null);
  const [callState, setCallState]           = useState("idle"); // idle | calling | incoming | connected | ended
  const [activeCallType, setActiveCallType] = useState("video"); // voice | video
  const [incomingCall, setIncomingCall]     = useState(null);   // { callerId, callerName, callerAvatar, offer, callType, projectId }
  const [activePartner, setActivePartner]   = useState(null);   // { id, name, avatar }
  const [isMuted, setIsMuted]               = useState(false);
  const [isVideoOff, setIsVideoOff]         = useState(false);
  const [isScreenSharing, setIsScreenShare] = useState(false);
  const [remoteIsSharingScreen, setRemoteIsSharingScreen] = useState(false);
  const [presenterName, setPresenterName]   = useState("");
  const [callDuration, setCallDuration]     = useState(0);

  const peerConnectionRef     = useRef(null);
  const timerRef              = useRef(null);
  const ringtoneIntervalRef   = useRef(null);
  const outgoingIntervalRef   = useRef(null);
  const screenTrackRef        = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const targetUserIdRef       = useRef(null);
  const remoteStreamRef       = useRef(null);
  const wasVideoOffBeforeScreenShareRef = useRef(false);

  // ── Synthetic Silent Audio Track (used when physical mic is locked by another app/tab) ──
  const createSilentAudioTrack = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      const gain = ctx.createGain();
      gain.gain.value = 0; // Complete silence
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      if (track) {
        const origStop = track.stop.bind(track);
        track.stop = () => {
          try {
            osc.stop();
            ctx.close();
          } catch (e) {}
          origStop();
        };
      }
      return track;
    } catch (e) {
      console.warn("[WebRTC] Could not create silent audio track fallback:", e);
      return null;
    }
  }, []);

  // ── Outgoing Calling Dial Tone Generator (WhatsApp-style 425Hz pulsing dial tone) ──
  const playOutgoingTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(425, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.25);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (callState === "calling") {
      playOutgoingTone();
      outgoingIntervalRef.current = setInterval(playOutgoingTone, 2800);
    } else {
      if (outgoingIntervalRef.current) {
        clearInterval(outgoingIntervalRef.current);
        outgoingIntervalRef.current = null;
      }
    }
    return () => {
      if (outgoingIntervalRef.current) clearInterval(outgoingIntervalRef.current);
    };
  }, [callState, playOutgoingTone]);

  // ── Web Audio API Ringtone Generator (100% reliable across all browsers) ──
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc2.frequency.setValueAtTime(480, ctx.currentTime); // B4

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.85);
      osc2.stop(ctx.currentTime + 0.85);
    } catch (e) {
      // Audio context may be restricted before user touch
    }
  }, []);

  useEffect(() => {
    if (callState === "incoming") {
      playChime();
      ringtoneIntervalRef.current = setInterval(playChime, 2200);
    } else {
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
        ringtoneIntervalRef.current = null;
      }
    }
    return () => {
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
    };
  }, [callState, playChime]);

  // Duration timer
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      if (callState === "idle") setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // Outgoing call ringing timeout (auto-hangup after 45s if no answer)
  useEffect(() => {
    let timeout = null;
    if (callState === "calling") {
      timeout = setTimeout(() => {
        toast.error("No answer. Call timed out.");
        endCall();
      }, 45000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [callState]);

  const endCallCleanup = useCallback(() => {
    if (outgoingIntervalRef.current) {
      clearInterval(outgoingIntervalRef.current);
      outgoingIntervalRef.current = null;
    }
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    wasVideoOffBeforeScreenShareRef.current = false;
    iceCandidatesQueueRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setCallState("idle");
    setIncomingCall(null);
    setActivePartner(null);
    setIsScreenShare(false);
    setRemoteIsSharingScreen(false);
    setPresenterName("");
    setIsMuted(false);
    setIsVideoOff(false);
  }, [localStream, screenStream]);

  const processIceQueue = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;
    const queued = [...iceCandidatesQueueRef.current];
    iceCandidatesQueueRef.current = [];
    for (const cand of queued) {
      if (!cand) continue;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn("[WebRTC] Error processing queued ICE candidate:", e?.message);
      }
    }
  };

  // Socket signaling listener at top level
  useEffect(() => {
    if (!isAuthenticated) return;

    const sock = getSocket() || connectSocket();
    if (!sock) return;

    const onIncoming = ({ callerId, callerName, callerAvatar, offer, callType, projectId }) => {
      setIncomingCall({ callerId, callerName, callerAvatar, offer, callType, projectId });
      setActivePartner({ id: callerId, name: callerName || "User", avatar: callerAvatar || "" });
      setActiveCallType(callType || "video");
      targetUserIdRef.current = callerId;
      setCallState("incoming");
      toast(`Incoming ${callType === "voice" ? "voice" : "video"} call from ${callerName || "User"}…`, { icon: "📞" });
    };

    const onAnswered = async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (pc && pc.signalingState === "have-local-offer") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await processIceQueue();
          setCallState("connected");
          toast.success("Call connected");
        } catch (e) {
          console.error("Error setting remote description on answer:", e);
        }
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.signalingState !== "closed" && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Could not immediately add ICE candidate, queueing:", e?.message);
          iceCandidatesQueueRef.current.push(candidate);
        }
      } else {
        iceCandidatesQueueRef.current.push(candidate);
      }
    };

    const onScreenShare = ({ isSharing, presenterName: name }) => {
      setRemoteIsSharingScreen(Boolean(isSharing));
      setPresenterName(name || "");
      if (isSharing) {
        toast(`${name || "Partner"} started sharing their screen`, { icon: "🖥️" });
      } else {
        toast(`${name || "Partner"} stopped sharing their screen`, { icon: "🖥️" });
      }

      if (remoteStreamRef.current) {
        setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
      }
    };

    const onRenegotiate = async ({ senderId, offer, callType }) => {
      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState === "closed") return;
      try {
        if (callType === "video") {
          setActiveCallType("video");
        } else if (callType === "voice") {
          setActiveCallType("voice");
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processIceQueue();

        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        answer.sdp = optimizeSdp(answer.sdp);
        await pc.setLocalDescription(answer);

        if (remoteStreamRef.current) {
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        }

        const s = getSocket();
        if (s) {
          s.emit("call:renegotiate_answer", { targetUserId: senderId, answer, callType });
        }
      } catch (err) {
        console.error("Renegotiate error on receiver:", err);
      }
    };

    const onRenegotiateAnswer = async ({ answer, callType }) => {
      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState === "closed") return;
      try {
        if (callType === "video") {
          setActiveCallType("video");
        } else if (callType === "voice") {
          setActiveCallType("voice");
        }
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue();

        if (remoteStreamRef.current) {
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        }
      } catch (err) {
        console.error("Renegotiate answer error on sender:", err);
      }
    };

    const onRejected = () => {
      toast.error("Call was declined.");
      endCallCleanup();
    };

    const onUnavailable = ({ message }) => {
      toast.error(message || "User is currently offline.");
      endCallCleanup();
    };

    const onBusy = ({ message }) => {
      toast.error(message || "User is currently on another call.");
      endCallCleanup();
    };

    const onEnded = ({ reason } = {}) => {
      toast(reason ? `Call ended (${reason})` : "Call ended.");
      endCallCleanup();
    };

    sock.on("call:incoming",            onIncoming);
    sock.on("call:answered",            onAnswered);
    sock.on("call:ice_candidate",       onIceCandidate);
    sock.on("call:screen_share",        onScreenShare);
    sock.on("call:renegotiate",         onRenegotiate);
    sock.on("call:renegotiate_answer",  onRenegotiateAnswer);
    sock.on("call:rejected",            onRejected);
    sock.on("call:unavailable",         onUnavailable);
    sock.on("call:busy",                onBusy);
    sock.on("call:ended",               onEnded);

    return () => {
      sock.off("call:incoming",            onIncoming);
      sock.off("call:answered",            onAnswered);
      sock.off("call:ice_candidate",       onIceCandidate);
      sock.off("call:screen_share",        onScreenShare);
      sock.off("call:renegotiate",         onRenegotiate);
      sock.off("call:renegotiate_answer",  onRenegotiateAnswer);
      sock.off("call:rejected",            onRejected);
      sock.off("call:unavailable",         onUnavailable);
      sock.off("call:busy",                onBusy);
      sock.off("call:ended",               onEnded);
    };
  }, [isAuthenticated, endCallCleanup]);

  // Resilient Media stream acquisition (independently isolates audio & video failures)
  const getMediaStream = async (requestVideo) => {
    let videoTrack = null;
    let audioTrack = null;

    // 1. Acquire Video if requested
    if (requestVideo) {
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 },
            facingMode: "user",
          },
        });
        videoTrack = vStream.getVideoTracks()[0];
      } catch (vErr) {
        console.warn("[Media] High-res video acquisition failed, attempting basic video:", vErr?.message);
        try {
          const basicVStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoTrack = basicVStream.getVideoTracks()[0];
        } catch (basicVErr) {
          console.warn("[Media] Physical camera unavailable/locked, activating live virtual video stream:", basicVErr?.message);
          try {
            const virtualStream = createVirtualVideoStream(user?.name || "Skillora User");
            videoTrack = virtualStream.getVideoTracks()[0];
            toast("Camera busy in another window. Live virtual stream active.", { icon: "📹", duration: 4000 });
          } catch (virtErr) {
            console.error("[Media] Virtual video creation failed:", virtErr);
          }
        }
      }
    }

    // 2. Acquire Audio with Studio/WhatsApp HD constraints
    try {
      const aStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 2 },
          sampleRate: { ideal: 48000 },
        },
      });
      audioTrack = aStream.getAudioTracks()[0];
    } catch (aErr) {
      console.warn("[Media] Advanced audio constraints failed, attempting basic audio:", aErr?.message);
      try {
        const basicAStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = basicAStream.getAudioTracks()[0];
      } catch (basicAErr) {
        console.warn("[Media] Physical microphone locked/unavailable (NotReadableError). Using fallback silent audio track:", basicAErr?.message);
        audioTrack = createSilentAudioTrack();
        toast("Microphone in use by another app. Connected with muted audio.", { icon: "🎙️", duration: 4500 });
      }
    }

    const tracks = [];
    if (audioTrack) tracks.push(audioTrack);
    if (videoTrack) tracks.push(videoTrack);

    // Ensure we always return a valid MediaStream with tracks
    if (tracks.length === 0) {
      const silentAudio = createSilentAudioTrack();
      if (silentAudio) tracks.push(silentAudio);
      if (requestVideo) {
        const virt = createVirtualVideoStream(user?.name || "Skillora User");
        if (virt.getVideoTracks()[0]) tracks.push(virt.getVideoTracks()[0]);
      }
    }

    return new MediaStream(tracks);
  };

  const bindRemoteTracks = (pc) => {
    pc.ontrack = (e) => {
      console.log("[WebRTC] ontrack received:", e.track.kind, "id:", e.track.id, "enabled:", e.track.enabled, "muted:", e.track.muted);
      if (e.streams && e.streams[0]) {
        remoteStreamRef.current = e.streams[0];
        setRemoteStream(e.streams[0]);
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        const currentTracks = remoteStreamRef.current.getTracks();
        if (!currentTracks.some((t) => t.id === e.track.id)) {
          const sameKind = currentTracks.filter((t) => t.kind === e.track.kind);
          sameKind.forEach((t) => remoteStreamRef.current.removeTrack(t));
          remoteStreamRef.current.addTrack(e.track);
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        }
      }

      e.track.onunmute = () => {
        if (remoteStreamRef.current) {
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        }
      };

      e.track.onmute = () => {
        if (remoteStreamRef.current) {
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        }
      };

      e.track.onended = () => {
        if (remoteStreamRef.current) {
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        }
      };
    };
  };

  // Start outgoing call
  const startCall = async (targetUserId, type = "video", partnerName = "Contact", partnerAvatar = "") => {
    if (!targetUserId) {
      toast.error("No contact selected to call.");
      return;
    }

    const socket = getSocket() || connectSocket();
    if (!socket || !socket.connected) {
      toast.error("Connecting call server… Please try again in 2 seconds.");
      return;
    }

    targetUserIdRef.current = targetUserId.toString();
    setActivePartner({ id: targetUserId.toString(), name: partnerName, avatar: partnerAvatar });
    setActiveCallType(type);
    setIsVideoOff(type === "voice");
    setIsMuted(false);
    setCallState("calling");

    try {
      // Synchronously acquire media within user click event context
      const stream = await getMediaStream(type === "video");
      setLocalStream(stream);

      const rtcConfig = await getResolvedRTCConfig();
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          console.log("[WebRTC] ICE handshake succeeded - live media stream active!");
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Peer connection state:", pc.connectionState);
      };

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      bindRemoteTracks(pc);

      pc.onicecandidate = (e) => {
        if (e.candidate && targetUserIdRef.current) {
          socket.emit("call:ice_candidate", {
            targetUserId: targetUserIdRef.current,
            candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
          });
        }
      };

      if (type === "voice") {
        try {
          pc.addTransceiver("video", { direction: "recvonly" });
        } catch (e) {
          console.warn("Could not add video transceiver:", e);
        }
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      offer.sdp = optimizeSdp(offer.sdp);
      await pc.setLocalDescription(offer);

      socket.emit("call:initiate", {
        targetUserId: targetUserIdRef.current,
        offer,
        callType: type,
        callerName: user?.name || "Skillora User",
        callerAvatar: user?.avatar || "",
      });
    } catch (err) {
      toast.error(`Media access failed: ${err.message}`);
      setCallState("idle");
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    const socket = getSocket() || connectSocket();
    if (!incomingCall || !socket) return;

    setCallState("connected");
    targetUserIdRef.current = incomingCall.callerId;
    setActiveCallType(incomingCall.callType || "video");
    setIsVideoOff(incomingCall.callType === "voice");
    setIsMuted(false);

    try {
      // Acquire media synchronously in user gesture
      const stream = await getMediaStream(incomingCall.callType === "video");
      setLocalStream(stream);

      const rtcConfig = await getResolvedRTCConfig();
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC] (Receiver) ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          console.log("[WebRTC] (Receiver) ICE handshake succeeded - live media stream active!");
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] (Receiver) Peer connection state:", pc.connectionState);
      };

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      bindRemoteTracks(pc);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice_candidate", {
            targetUserId: incomingCall.callerId,
            candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await processIceQueue();

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      answer.sdp = optimizeSdp(answer.sdp);
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { callerId: incomingCall.callerId, answer });
    } catch (err) {
      toast.error(`Could not accept call: ${err.message}`);
      rejectCall();
    }
  };

  const rejectCall = () => {
    const socket = getSocket();
    if (incomingCall && socket) {
      socket.emit("call:reject", { callerId: incomingCall.callerId });
    }
    endCallCleanup();
  };

  const endCall = () => {
    const socket = getSocket();
    const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
    if (target && socket) {
      socket.emit("call:end", { targetUserId: target, durationSeconds: callDuration });
    }
    endCallCleanup();
  };

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !isMuted;
        audioTracks.forEach((t) => (t.enabled = !nextState));
        setIsMuted(nextState);
        toast(nextState ? "Microphone muted" : "Microphone unmuted", { icon: nextState ? "🔇" : "🎙️" });
      }
    }
  }, [localStream, isMuted]);

  const toggleVideo = useCallback(async () => {
    try {
      const pc = peerConnectionRef.current;
      const currentVideoTracks = localStream ? localStream.getVideoTracks() : [];
      const hasLiveTrack = currentVideoTracks.some((t) => t.readyState === "live");

      if (currentVideoTracks.length === 0 || !hasLiveTrack) {
        // Upgrade audio/voice call to video by acquiring webcam
        let newTrack = null;
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          });
          newTrack = videoStream.getVideoTracks()[0];
        } catch (camErr) {
          console.warn("Camera busy on toggle, using live virtual video:", camErr?.message);
          const virtualStream = createVirtualVideoStream(user?.name || "Skillora User");
          newTrack = virtualStream.getVideoTracks()[0];
          toast("Camera busy in another tab. Live virtual stream active.", { icon: "📹", duration: 4000 });
        }
        if (!newTrack) return;

        let updatedStream = localStream;
        if (localStream) {
          localStream.addTrack(newTrack);
          updatedStream = new MediaStream(localStream.getTracks());
          setLocalStream(updatedStream);
        } else {
          updatedStream = new MediaStream([newTrack]);
          setLocalStream(updatedStream);
        }

        if (pc) {
          let videoTransceiver = pc.getTransceivers().find(
            (t) => t.receiver?.track?.kind === "video" || t.sender?.track?.kind === "video"
          );

          if (videoTransceiver) {
            videoTransceiver.direction = "sendrecv";
            await videoTransceiver.sender.replaceTrack(newTrack);
          } else {
            pc.addTrack(newTrack, updatedStream);
          }

          // Trigger WebRTC renegotiation so remote partner immediately receives the video stream!
          const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
          if (target) {
            try {
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              });
              offer.sdp = optimizeSdp(offer.sdp);
              await pc.setLocalDescription(offer);
              const s = getSocket();
              if (s) {
                s.emit("call:renegotiate", {
                  targetUserId: target,
                  offer,
                  callType: "video",
                });
              }
            } catch (negErr) {
              console.warn("Renegotiation offer creation error:", negErr);
            }
          }
        }

        setIsVideoOff(false);
        setActiveCallType("video");
        toast.success("Converted to video call");
      } else {
        const nextState = !isVideoOff;
        if (!nextState) {
          // Turning camera ON
          let liveTrack = currentVideoTracks.find((t) => t.readyState === "live");
          if (liveTrack) {
            liveTrack.enabled = true;
            if (pc) {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
              if (sender) {
                await sender.replaceTrack(liveTrack);
              }
            }
          }
          setIsVideoOff(false);
          setActiveCallType("video");
          toast("Camera turned on", { icon: "📹" });
        } else {
          // Turning camera OFF
          currentVideoTracks.forEach((t) => (t.enabled = false));
          setIsVideoOff(true);
          if (pc) {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
            if (sender) {
              await sender.replaceTrack(null);
            }
          }
          toast("Camera turned off", { icon: "📷" });
        }
      }
    } catch (err) {
      console.error("Toggle camera error:", err);
      toast.error("Could not access camera: " + err.message);
    }
  }, [localStream, isVideoOff, incomingCall, activePartner, user]);

  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) {
      try { screenTrackRef.current.stop(); } catch (e) {}
      screenTrackRef.current = null;
    }
    setScreenStream(null);
    setIsScreenShare(false);

    const wasVoice = wasVideoOffBeforeScreenShareRef.current;
    const pc = peerConnectionRef.current;

    if (pc) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");

      if (wasVoice) {
        // Return to Voice Call mode: keep camera OFF
        if (sender) {
          await sender.replaceTrack(null).catch(() => {});
        }
        if (localStream) {
          localStream.getVideoTracks().forEach((t) => {
            try { t.stop(); } catch (e) {}
          });
          const audioTracks = localStream.getAudioTracks();
          setLocalStream(new MediaStream(audioTracks));
        }
        setIsVideoOff(true);
        setActiveCallType("voice");

        const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
        if (target) {
          try {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            offer.sdp = optimizeSdp(offer.sdp);
            await pc.setLocalDescription(offer);
            const s = getSocket();
            if (s) {
              s.emit("call:renegotiate", { targetUserId: target, offer, callType: "voice" });
            }
          } catch (negErr) {
            console.warn("Renegotiate on stop screen share voice mode error:", negErr);
          }
        }
        toast("Screen sharing stopped, returned to voice call", { icon: "🎙️" });
      } else {
        // Return to Video Call mode: restore camera
        let camTrack = localStream?.getVideoTracks()?.find((t) => t.readyState === "live");
        if (!camTrack) {
          try {
            const vStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            });
            camTrack = vStream.getVideoTracks()[0];
          } catch (e) {
            console.warn("Could not acquire physical camera, using virtual video:", e?.message);
            const virtualStream = createVirtualVideoStream(user?.name || "Skillora User");
            camTrack = virtualStream.getVideoTracks()[0];
          }
        }

        if (camTrack) {
          camTrack.enabled = true;
          camTrack.contentHint = "motion";
          if (localStream) {
            localStream.getVideoTracks().forEach((t) => {
              if (t !== camTrack) {
                try { t.stop(); } catch (e) {}
              }
            });
            const audioTracks = localStream.getAudioTracks();
            setLocalStream(new MediaStream([...audioTracks, camTrack]));
          } else {
            setLocalStream(new MediaStream([camTrack]));
          }
          if (sender) {
            await sender.replaceTrack(camTrack).catch(() => {});
          }
        }

        setIsVideoOff(false);
        setActiveCallType("video");

        const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
        if (target) {
          try {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            offer.sdp = optimizeSdp(offer.sdp);
            await pc.setLocalDescription(offer);
            const s = getSocket();
            if (s) {
              s.emit("call:renegotiate", { targetUserId: target, offer, callType: "video" });
            }
          } catch (negErr) {
            console.warn("Renegotiate on stop screen share video mode error:", negErr);
          }
        }
        toast("Screen sharing stopped, switched to camera", { icon: "📹" });
      }
    }

    // Notify peer via socket that screen share stopped
    const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
    const socket = getSocket();
    if (target && socket) {
      socket.emit("call:screen_share", {
        targetUserId: target,
        isSharing: false,
      });
    }
  }, [localStream, incomingCall, activePartner, user]);

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return;
    if (!isScreenSharing) {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== "function") {
        toast.error("Screen sharing is not supported on this mobile browser or device.");
        return;
      }

      // Remember if user was in voice/video-off mode before screen sharing
      wasVideoOffBeforeScreenShareRef.current = Boolean(isVideoOff);

      try {
        let displayStream = null;
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
        } catch (initialErr) {
          console.warn("[Media] Default display media failed, trying basic fallback:", initialErr?.message);
          displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }

        const screenTrack = displayStream?.getVideoTracks()[0];
        if (!screenTrack) return;

        try {
          screenTrack.contentHint = "detail";
        } catch (e) {}

        screenTrackRef.current = screenTrack;
        setScreenStream(displayStream);

        const pc = peerConnectionRef.current;
        let sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          sender = pc.addTrack(screenTrack, displayStream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const s = getSocket();
          const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
          if (s && target) {
            s.emit("call:renegotiate", { targetUserId: target, offer, callType: "video" });
          }
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenShare(true);
        setActiveCallType("video");

        // Notify peer via socket that screen share started
        const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
        const socket = getSocket();
        if (target && socket) {
          socket.emit("call:screen_share", {
            targetUserId: target,
            isSharing: true,
            presenterName: user?.name || "Partner",
          });
        }

        toast.success("Screen sharing started");
      } catch (e) {
        if (e.name !== "NotAllowedError" && e.name !== "AbortError") {
          console.error("Screen share error:", e);
          toast.error(e.message || "Could not start screen sharing");
        }
      }
    } else {
      await stopScreenShare();
    }
  }, [isScreenSharing, isVideoOff, stopScreenShare, user, incomingCall, activePartner]);

  return (
    <CallContext.Provider
      value={{
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        localStream,
        remoteStream,
        screenStream,
        callState,
        activeCallType,
        incomingCall,
        activePartner,
        isMuted,
        isVideoOff,
        isScreenSharing,
        remoteIsSharingScreen,
        presenterName,
        callDuration,
      }}
    >
      {children}

      {/* Global Call Modal Overlay mounted across the entire app */}
      <CallModal
        callState={callState}
        callType={activeCallType}
        localStream={localStream}
        remoteStream={remoteStream}
        screenStream={screenStream}
        onEndCall={endCall}
        onAccept={acceptCall}
        onReject={rejectCall}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        remoteIsSharingScreen={remoteIsSharingScreen}
        presenterName={presenterName}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        callDuration={callDuration}
        partnerName={incomingCall?.callerName || activePartner?.name || "Contact"}
        partnerAvatar={incomingCall?.callerAvatar || activePartner?.avatar || ""}
      />
    </CallContext.Provider>
  );
};
