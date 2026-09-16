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
  const [callState, setCallState]           = useState("idle"); // idle | calling | incoming | connected | ended
  const [activeCallType, setActiveCallType] = useState("video"); // voice | video
  const [incomingCall, setIncomingCall]     = useState(null);   // { callerId, callerName, callerAvatar, offer, callType, projectId }
  const [activePartner, setActivePartner]   = useState(null);   // { id, name, avatar }
  const [isMuted, setIsMuted]               = useState(false);
  const [isVideoOff, setIsVideoOff]         = useState(false);
  const [isScreenSharing, setIsScreenShare] = useState(false);
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
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    iceCandidatesQueueRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setIncomingCall(null);
    setActivePartner(null);
    setIsScreenShare(false);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [localStream]);

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

      const onRejected = () => {
        toast.error("Call was declined.");
        endCallCleanup();
      };

      const onEnded = () => {
        toast("Call ended.");
        endCallCleanup();
      };

      sock.on("call:incoming",      onIncoming);
      sock.on("call:answered",      onAnswered);
      sock.on("call:ice_candidate", onIceCandidate);
      sock.on("call:rejected",      onRejected);
      sock.on("call:ended",         onEnded);

      return () => {
        sock.off("call:incoming",      onIncoming);
        sock.off("call:answered",      onAnswered);
        sock.off("call:ice_candidate", onIceCandidate);
        sock.off("call:rejected",      onRejected);
        sock.off("call:ended",         onEnded);
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
          toast("Camera unavailable, using audio stream…", { icon: "🎙️" });
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
      }
      throw err;
    }
  };

  const bindRemoteTracks = (pc) => {
    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        const stream = e.streams[0];
        setRemoteStream(new MediaStream(stream.getTracks()));
        stream.onaddtrack = () => {
          setRemoteStream(new MediaStream(stream.getTracks()));
        };
        stream.onremovetrack = () => {
          setRemoteStream(new MediaStream(stream.getTracks()));
        };
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

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
      });
      await pc.setLocalDescription(offer);

      socket.emit("call:initiate", {
        targetUserId: targetUserIdRef.current,
        offer,
        callType: type,
        callerName: user?.name || "Skillora User",
        callerAvatar: user?.avatar || "",
      });

      toast.loading(`Calling ${partnerName}…`, { id: "call-status" });
    } catch (err) {
      toast.error(`Media access failed: ${err.message}`, { id: "call-status" });
      setCallState("idle");
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    const socket = getSocket() || connectSocket();
    if (!incomingCall || !socket) return;

    toast.dismiss("call-status");
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

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await processIceQueue();

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: incomingCall.callType === "video",
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
    toast.dismiss("call-status");
    endCallCleanup();
  };

  const endCall = () => {
    const socket = getSocket();
    const target = targetUserIdRef.current || incomingCall?.callerId || activePartner?.id;
    if (target && socket) {
      socket.emit("call:end", { targetUserId: target, durationSeconds: callDuration });
    }
    toast.dismiss("call-status");
    endCallCleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsVideoOff((prev) => !prev);
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);

        screenTrack.onended = () => toggleScreenShare();
        setIsScreenShare(true);
      } catch (e) {
        console.error("Screen share error:", e);
      }
    } else {
      const videoTrack = localStream?.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender && videoTrack) sender.replaceTrack(videoTrack);
      screenTrackRef.current?.stop();
      setIsScreenShare(false);
    }
  };

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
        callState,
        activeCallType,
        incomingCall,
        activePartner,
        isMuted,
        isVideoOff,
        isScreenSharing,
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
        onEndCall={endCall}
        onAccept={acceptCall}
        onReject={rejectCall}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
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
