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

// ── Low-latency WebRTC SDP enhancer: Opus voice tuning (AEC, FEC, DTX) & video bandwidth control ──
const optimizeSdp = (sdp) => {
  if (!sdp) return sdp;
  let s = sdp;
  s = s.replace(/a=fmtp:(\d+) (.*)/g, (match, pt, params) => {
    if (s.includes(`a=rtpmap:${pt} opus/48000`)) {
      return `a=fmtp:${pt} minptime=10;useinbandfec=1;usedtx=1;maxaveragebitrate=32000;cbr=0`;
    }
    return match;
  });
  // Cap max video bandwidth to 1800 kbps to prevent network buffer bloat and packet drops
  if (!s.includes("b=AS:") && !s.includes("b=TIAS:")) {
    s = s.replace(/(m=video \d+ [A-Z\/]+ \d+)/g, "$1\r\nb=AS:1800");
  }
  return s;
};

const tuneSender = async (sender, isScreenShare = false) => {
  if (!sender || typeof sender.getParameters !== "function" || typeof sender.setParameters !== "function") return;
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    if (sender.track?.kind === "video") {
      params.encodings[0].maxBitrate = isScreenShare ? 2500000 : 1500000;
      params.encodings[0].maxFramerate = 30;
      params.encodings[0].networkPriority = "high";
      params.encodings[0].priority = "high";
      params.degradationPreference = isScreenShare ? "maintain-resolution" : "maintain-framerate";
    } else if (sender.track?.kind === "audio") {
      params.encodings[0].maxBitrate = 32000;
      params.encodings[0].networkPriority = "high";
      params.encodings[0].priority = "high";
    }
    await sender.setParameters(params);
  } catch (e) {}
};

const tunePeerConnection = async (pc, isScreenShare = false) => {
  if (!pc) return;
  const senders = pc.getSenders();
  for (const sender of senders) {
    await tuneSender(sender, isScreenShare);
  }
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
  const localStreamRef        = useRef(null);
  const screenStreamRef       = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const targetUserIdRef       = useRef(null);

  // Synchronize stream refs
  const updateLocalStream = (stream) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  };

  const updateScreenStream = (stream) => {
    screenStreamRef.current = stream;
    setScreenStream(stream);
  };

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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      try { screenTrackRef.current.stop(); } catch (e) {}
      screenTrackRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
      screenStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }
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
  }, []);

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

      // Re-sync remote stream from peer connection to immediately attach camera video
      const pc = peerConnectionRef.current;
      if (pc) {
        const tracks = pc.getReceivers().map((r) => r.track).filter(Boolean);
        if (tracks.length > 0) {
          setRemoteStream(new MediaStream(tracks));
        }
      }
    };

    const onRenegotiate = async ({ senderId, offer, callType }) => {
      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState === "closed") return;
      try {
        if (callType === "video") {
          setActiveCallType("video");
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processIceQueue();

        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        answer.sdp = optimizeSdp(answer.sdp);
        await pc.setLocalDescription(answer);
        await tunePeerConnection(pc, false);

        // Immediately sync remote stream tracks on receiver
        const remoteTracks = pc.getReceivers().map((r) => r.track).filter(Boolean);
        if (remoteTracks.length > 0) {
          remoteTracks.forEach((t) => {
            t.onunmute = () => {
              const fresh = pc.getReceivers().map((r) => r.track).filter(Boolean);
              setRemoteStream(new MediaStream(fresh));
            };
          });
          setRemoteStream(new MediaStream(remoteTracks));
        }

        const s = getSocket();
        if (s) {
          s.emit("call:renegotiate_answer", { targetUserId: senderId, answer, callType });
        }
        toast("Call converted to video", { icon: "📹" });
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
        }
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue();
        await tunePeerConnection(pc, false);

        // Immediately sync remote stream tracks on sender
        const remoteTracks = pc.getReceivers().map((r) => r.track).filter(Boolean);
        if (remoteTracks.length > 0) {
          setRemoteStream(new MediaStream(remoteTracks));
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
    // Release any lingering tracks before requesting fresh hardware handles
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
      localStreamRef.current = null;
    }

    let videoTrack = null;
    let audioTrack = null;

    // 1. Acquire Video if requested
    if (requestVideo) {
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: "user",
          },
        });
        videoTrack = vStream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            videoTrack.contentHint = "motion";
          } catch (e) {}
        }
      } catch (vErr) {
        console.warn("[Media] High-res video acquisition failed, attempting basic video:", vErr?.message);
        try {
          const basicVStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoTrack = basicVStream.getVideoTracks()[0];
          if (videoTrack) {
            try {
              videoTrack.contentHint = "motion";
            } catch (e) {}
          }
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

    // 2. Acquire Audio with Studio AEC constraints (using ideal constraints for universal hardware compatibility)
    try {
      const aStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 1 },
        },
      });
      audioTrack = aStream.getAudioTracks()[0];
      if (audioTrack) {
        try {
          audioTrack.contentHint = "speech";
        } catch (e) {}
      }
    } catch (aErr) {
      console.warn("[Media] Ideal audio constraints failed, trying basic audio:", aErr?.message);
      try {
        const basicAStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = basicAStream.getAudioTracks()[0];
        if (audioTrack) {
          try {
            audioTrack.contentHint = "speech";
          } catch (e) {}
        }
      } catch (basicAErr) {
        console.warn("[Media] Physical microphone locked/unavailable. Using fallback silent audio track:", basicAErr?.message);
        audioTrack = createSilentAudioTrack();
        toast("Microphone busy or in use by another tab/app.", { icon: "🎙️", duration: 4000 });
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

    const stream = new MediaStream(tracks);
    localStreamRef.current = stream;
    return stream;
  };

  const bindRemoteTracks = (pc) => {
    const syncRemoteStream = () => {
      const tracks = pc.getReceivers().map((r) => r.track).filter(Boolean);
      if (tracks.length > 0) {
        setRemoteStream(new MediaStream(tracks));
      }
    };

    pc.ontrack = (e) => {
      console.log("[WebRTC] ontrack received:", e.track.kind, "id:", e.track.id, "enabled:", e.track.enabled, "muted:", e.track.muted);
      syncRemoteStream();

      e.track.onunmute = () => {
        console.log("[WebRTC] Remote track unmuted:", e.track.kind, e.track.id);
        syncRemoteStream();
      };

      e.track.onmute = () => {
        console.log("[WebRTC] Remote track muted:", e.track.kind, e.track.id);
        syncRemoteStream();
      };

      e.track.onended = () => {
        console.log("[WebRTC] Remote track ended:", e.track.kind, e.track.id);
        syncRemoteStream();
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
      updateLocalStream(stream);

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
      await tunePeerConnection(pc, false);

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
      updateLocalStream(stream);

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
      await tunePeerConnection(pc, false);

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
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !isMuted;
        audioTracks.forEach((t) => (t.enabled = !nextState));
        setIsMuted(nextState);
        toast(nextState ? "Microphone muted" : "Microphone unmuted", { icon: nextState ? "🔇" : "🎙️" });
      }
    }
  }, [isMuted]);

  const toggleVideo = useCallback(async () => {
    try {
      const pc = peerConnectionRef.current;
      const currentStream = localStreamRef.current;
      const currentVideoTracks = currentStream ? currentStream.getVideoTracks() : [];
      const hasLiveTrack = currentVideoTracks.some((t) => t.readyState === "live");

      if (currentVideoTracks.length === 0 || !hasLiveTrack) {
        // Upgrade audio/voice call to video by acquiring webcam
        let newTrack = null;
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 }, facingMode: "user" },
          });
          newTrack = videoStream.getVideoTracks()[0];
          if (newTrack) newTrack.contentHint = "motion";
        } catch (camErr) {
          console.warn("Camera busy on toggle, using live virtual video:", camErr?.message);
          const virtualStream = createVirtualVideoStream(user?.name || "Skillora User");
          newTrack = virtualStream.getVideoTracks()[0];
          toast("Camera busy in another tab. Live virtual stream active.", { icon: "📹", duration: 4000 });
        }
        if (!newTrack) return;

        let updatedStream = currentStream;
        if (currentStream) {
          currentStream.addTrack(newTrack);
          updatedStream = new MediaStream(currentStream.getTracks());
          updateLocalStream(updatedStream);
        } else {
          updatedStream = new MediaStream([newTrack]);
          updateLocalStream(updatedStream);
        }

        if (pc) {
          let videoTransceiver = pc.getTransceivers().find(
            (t) => t.receiver?.track?.kind === "video" || t.sender?.track?.kind === "video"
          );

          if (videoTransceiver) {
            videoTransceiver.direction = "sendrecv";
            await videoTransceiver.sender.replaceTrack(newTrack);
            await tuneSender(videoTransceiver.sender, false);
          } else {
            const sender = pc.addTrack(newTrack, updatedStream);
            await tuneSender(sender, false);
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
            liveTrack.contentHint = "motion";
            if (pc) {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
              if (sender) {
                await sender.replaceTrack(liveTrack);
                await tuneSender(sender, false);
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
  }, [isVideoOff, incomingCall, activePartner, user]);

  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) {
      try { screenTrackRef.current.stop(); } catch (e) {}
      screenTrackRef.current = null;
    }
    updateScreenStream(null);

    const pc = peerConnectionRef.current;
    if (pc) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
      if (sender) {
        let camTrack = localStreamRef.current?.getVideoTracks()?.find((t) => t.readyState === "live");
        
        // If camera track was lost, acquire a fresh webcam track
        if (!camTrack && !isVideoOff) {
          try {
            const vStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 }, facingMode: "user" },
            });
            camTrack = vStream.getVideoTracks()[0];
            if (camTrack) camTrack.contentHint = "motion";
            if (localStreamRef.current) {
              localStreamRef.current.addTrack(camTrack);
              updateLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            } else {
              updateLocalStream(new MediaStream([camTrack]));
            }
          } catch (e) {
            console.warn("Could not reacquire camera on stop screen share:", e);
          }
        }

        if (camTrack && !isVideoOff) {
          camTrack.contentHint = "motion";
          await sender.replaceTrack(camTrack).catch(() => {});
          await tuneSender(sender, false);
        } else {
          await sender.replaceTrack(null).catch(() => {});
        }
      }
    }

    setIsScreenShare(false);

    // Notify peer via socket that screen share stopped
    const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
    const socket = getSocket();
    if (target && socket) {
      socket.emit("call:screen_share", {
        targetUserId: target,
        isSharing: false,
      });
    }

    toast("Screen sharing stopped", { icon: "🖥️" });
  }, [isVideoOff, incomingCall, activePartner]);

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return;
    if (!isScreenSharing) {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== "function") {
        toast.error("Screen sharing is not supported on this mobile browser or device.");
        return;
      }

      try {
        let displayStream = null;
        try {
          // Mobile & cross-browser compliant constraints (without desktop-only monitor keywords)
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

        // Hint to WebRTC encoder to optimize sharpness for text/details
        try {
          screenTrack.contentHint = "detail";
        } catch (e) {}

        screenTrackRef.current = screenTrack;
        updateScreenStream(displayStream);

        const pc = peerConnectionRef.current;
        let sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
          await tuneSender(sender, true);
        } else {
          sender = pc.addTrack(screenTrack, displayStream);
          await tuneSender(sender, true);
          const offer = await pc.createOffer();
          offer.sdp = optimizeSdp(offer.sdp);
          await pc.setLocalDescription(offer);
          const s = getSocket();
          const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
          if (s && target) {
            s.emit("call:renegotiate", { targetUserId: target, offer });
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
  }, [isScreenSharing, stopScreenShare, user, incomingCall, activePartner]);

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
