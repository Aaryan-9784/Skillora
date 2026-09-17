import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { getSocket, connectSocket } from "../services/socketService";
import { getResolvedRTCConfig } from "../utils/webrtcConfig";
import CallModal from "../components/chat/CallModal";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
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
  const screenTrackRef        = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const targetUserIdRef       = useRef(null);

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

  const endCallCleanup = useCallback(() => {
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
    if (!pc || !pc.remoteDescription) return;
    while (iceCandidatesQueueRef.current.length > 0) {
      const cand = iceCandidatesQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.error("Error processing queued ICE candidate:", e);
      }
    }
  };

  // Socket signaling listener at top level
  useEffect(() => {
    if (!isAuthenticated) return;

    let activeSocket = getSocket() || connectSocket();

    const setupListeners = (sock) => {
      if (!sock) return null;

      const onIncoming = ({ callerId, callerName, callerAvatar, offer, callType, projectId }) => {
        setIncomingCall({ callerId, callerName, callerAvatar, offer, callType, projectId });
        setActivePartner({ id: callerId, name: callerName || "User", avatar: callerAvatar || "" });
        setActiveCallType(callType || "video");
        targetUserIdRef.current = callerId;
        setCallState("incoming");
        toast(`Incoming ${callType === "voice" ? "voice" : "video"} call from ${callerName || "User"}…`, { icon: "📞" });
      };

      const onAnswered = async ({ answer }) => {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
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
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding ICE candidate:", e);
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
      };

      const onRenegotiate = async ({ senderId, offer }) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await processIceQueue();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const s = getSocket();
          if (s) {
            s.emit("call:renegotiate_answer", { targetUserId: senderId, answer });
          }
        } catch (err) {
          console.error("Renegotiate error on receiver:", err);
        }
      };

      const onRenegotiateAnswer = async ({ answer }) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await processIceQueue();
        } catch (err) {
          console.error("Renegotiate answer error on sender:", err);
        }
      };

      const onRejected = () => {
        toast.error("Call was declined.");
        endCallCleanup();
      };

      const onEnded = () => {
        toast("Call ended.");
        endCallCleanup();
      };

      sock.on("call:incoming",            onIncoming);
      sock.on("call:answered",            onAnswered);
      sock.on("call:ice_candidate",       onIceCandidate);
      sock.on("call:screen_share",        onScreenShare);
      sock.on("call:renegotiate",         onRenegotiate);
      sock.on("call:renegotiate_answer",  onRenegotiateAnswer);
      sock.on("call:rejected",            onRejected);
      sock.on("call:ended",               onEnded);

      return () => {
        sock.off("call:incoming",            onIncoming);
        sock.off("call:answered",            onAnswered);
        sock.off("call:ice_candidate",       onIceCandidate);
        sock.off("call:screen_share",        onScreenShare);
        sock.off("call:renegotiate",         onRenegotiate);
        sock.off("call:renegotiate_answer",  onRenegotiateAnswer);
        sock.off("call:rejected",            onRejected);
        sock.off("call:ended",               onEnded);
      };
    };

    let cleanup = setupListeners(activeSocket);

    const checkInterval = setInterval(() => {
      const currentSocket = getSocket() || connectSocket();
      if (currentSocket && currentSocket !== activeSocket) {
        if (cleanup) cleanup();
        activeSocket = currentSocket;
        cleanup = setupListeners(activeSocket);
      }
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      if (cleanup) cleanup();
    };
  }, [isAuthenticated, endCallCleanup]);

  // Synchronous Media stream request (preserves mobile user gestures)
  const getMediaStream = async (requestVideo) => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: requestVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });
    } catch (err) {
      if (requestVideo) {
        console.warn("Primary constraints failed, falling back to simple video/audio:", err?.message);
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch (videoErr) {
          console.warn("Camera unavailable, falling back to audio only:", videoErr?.message);
          if (videoErr?.name === "NotReadableError") {
            toast("Camera is in use by another tab or app. Using audio only.", { icon: "📷", duration: 5000 });
          } else {
            toast("Camera unavailable, using audio only…", { icon: "🎙️", duration: 4000 });
          }
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
      }
      throw err;
    }
  };

  const bindRemoteTracks = (pc) => {
    pc.ontrack = (e) => {
      console.log("[WebRTC] ontrack received:", e.track.kind, "id:", e.track.id, "enabled:", e.track.enabled, "muted:", e.track.muted);
      const incomingStream = e.streams && e.streams[0] ? e.streams[0] : null;
      if (incomingStream) {
        setRemoteStream(incomingStream);
        incomingStream.onaddtrack = () => setRemoteStream(new MediaStream(incomingStream.getTracks()));
        incomingStream.onremovetrack = () => setRemoteStream(new MediaStream(incomingStream.getTracks()));
      } else if (e.track) {
        setRemoteStream((prev) => {
          const currentTracks = prev ? prev.getTracks().filter((t) => t.id !== e.track.id) : [];
          return new MediaStream([...currentTracks, e.track]);
        });
      }
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
    setCallState("calling");

    try {
      // Synchronously acquire media within user click event context
      const stream = await getMediaStream(type === "video");
      setLocalStream(stream);

      const rtcConfig = await getResolvedRTCConfig();
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed" && typeof pc.restartIce === "function") {
          console.warn("ICE connection failed, restarting ICE…");
          pc.restartIce();
        }
      };

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      bindRemoteTracks(pc);

      pc.onicecandidate = (e) => {
        if (e.candidate && targetUserIdRef.current) {
          socket.emit("call:ice_candidate", { targetUserId: targetUserIdRef.current, candidate: e.candidate });
        }
      };

      if (type === "voice") {
        try {
          pc.addTransceiver("video", { direction: "sendrecv" });
        } catch (e) {
          console.warn("Could not add video transceiver:", e);
        }
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
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

    try {
      // Acquire media synchronously in user gesture
      const stream = await getMediaStream(incomingCall.callType === "video");
      setLocalStream(stream);

      const rtcConfig = await getResolvedRTCConfig();
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed" && typeof pc.restartIce === "function") {
          pc.restartIce();
        }
      };

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      bindRemoteTracks(pc);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice_candidate", { targetUserId: incomingCall.callerId, candidate: e.candidate });
        }
      };

      if (incomingCall.callType === "voice") {
        try {
          pc.addTransceiver("video", { direction: "sendrecv" });
        } catch (e) {
          console.warn("Could not add video transceiver:", e);
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await processIceQueue();

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
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

      if (currentVideoTracks.length === 0) {
        // Upgrade audio call to video by acquiring camera
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        const newTrack = videoStream.getVideoTracks()[0];
        if (!newTrack) return;

        if (localStream) {
          localStream.addTrack(newTrack);
        } else {
          setLocalStream(videoStream);
        }

        if (pc) {
          let sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
          if (sender) {
            await sender.replaceTrack(newTrack);
          } else {
            pc.addTrack(newTrack, localStream || videoStream);
          }
        }

        setIsVideoOff(false);
        setActiveCallType("video");
        toast.success("Camera enabled");
      } else {
        const nextState = !isVideoOff;
        currentVideoTracks.forEach((t) => (t.enabled = !nextState));
        setIsVideoOff(nextState);

        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
          if (sender) {
            await sender.replaceTrack(nextState ? null : currentVideoTracks[0]);
          }
        }
        toast(nextState ? "Camera turned off" : "Camera turned on", { icon: nextState ? "📷" : "📹" });
      }
    } catch (err) {
      console.error("Toggle camera error:", err);
      toast.error("Could not access camera: " + err.message);
    }
  }, [localStream, isVideoOff]);

  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setScreenStream(null);

    const pc = peerConnectionRef.current;
    if (pc) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.kind === "video");
      if (sender) {
        const camTrack = localStream?.getVideoTracks()[0];
        if (camTrack && !isVideoOff) {
          camTrack.contentHint = "motion";
          await sender.replaceTrack(camTrack).catch(() => {});
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
  }, [localStream, isVideoOff, incomingCall, activePartner]);

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return;
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor",
          },
          audio: false,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) return;

        // Hint to WebRTC encoder to optimize sharpness for text/details (Google Meet & Zoom standard)
        screenTrack.contentHint = "detail";
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
        if (e.name !== "NotAllowedError") {
          console.error("Screen share error:", e);
          toast.error("Could not share screen: " + e.message);
        }
      }
    } else {
      await stopScreenShare();
    }
  }, [isScreenSharing, stopScreenShare, incomingCall, activePartner, user]);

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
