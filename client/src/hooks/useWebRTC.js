import { useRef, useState, useEffect, useCallback } from "react";
import { getSocket, connectSocket } from "../services/socketService";
import { RTC_CONFIG } from "../utils/webrtcConfig";
import toast from "react-hot-toast";

// Safety shim for react-hot-toast info calls across all browser bundles
if (toast && typeof toast.info !== "function") {
  toast.info = (msg, opts) => toast(msg, opts || { icon: "ℹ️" });
}

export const useWebRTC = (targetUserId, defaultCallType = "video") => {
  const [localStream, setLocalStream]       = useState(null);
  const [remoteStream, setRemoteStream]     = useState(null);
  const [callState, setCallState]           = useState("idle"); // idle | calling | incoming | connected | ended
  const [activeCallType, setActiveCallType] = useState(defaultCallType); // voice | video
  const [incomingCall, setIncomingCall]     = useState(null);   // { callerId, offer, callType }
  const [isMuted, setIsMuted]               = useState(false);
  const [isVideoOff, setIsVideoOff]         = useState(false);
  const [isScreenSharing, setIsScreenShare] = useState(false);
  const [callDuration, setCallDuration]     = useState(0);

  const peerConnectionRef     = useRef(null);
  const timerRef              = useRef(null);
  const screenTrackRef        = useRef(null);
  const iceCandidatesQueueRef = useRef([]);

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
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (screenTrackRef.current) screenTrackRef.current.stop();
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    iceCandidatesQueueRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setIncomingCall(null);
    setIsScreenShare(false);
  }, [localStream]);

  // Process any ICE candidates queued before remote description was set
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

  useEffect(() => {
    let activeSocket = getSocket() || connectSocket();

    const setupListeners = (sock) => {
      if (!sock) return null;

      const onIncoming = ({ callerId, offer, callType, projectId }) => {
        setIncomingCall({ callerId, offer, callType, projectId });
        setActiveCallType(callType || "video");
        setCallState("incoming");
        toast(`Incoming ${callType === "voice" ? "voice" : "video"} call…`, { icon: "📞" });
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
  }, [endCallCleanup]);

  const ensureSocketConnected = async () => {
    let socket = getSocket() || connectSocket();
    if (socket && socket.connected) return socket;

    return new Promise((resolve) => {
      let timer = null;
      let interval = null;

      const finish = (res) => {
        if (timer) clearTimeout(timer);
        if (interval) clearInterval(interval);
        resolve(res);
      };

      interval = setInterval(() => {
        const currentSocket = getSocket() || connectSocket();
        if (currentSocket && currentSocket.connected) {
          finish(currentSocket);
        }
      }, 200);

      timer = setTimeout(() => {
        const finalSocket = getSocket();
        finish(finalSocket && finalSocket.connected ? finalSocket : null);
      }, 4000);
    });
  };

  const getMediaStream = async (requestVideo) => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: requestVideo,
      });
    } catch (err) {
      if (requestVideo) {
        console.warn("Camera locked by another application/tab, falling back to audio stream:", err.message);
        toast("Camera busy in another tab, connecting voice stream...", { icon: "🎙️" });
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      }
      throw err;
    }
  };

  const startCall = async (type = defaultCallType) => {
    if (!targetUserId) {
      toast.error("No active user selected for this call.");
      return;
    }

    let socket = await ensureSocketConnected();
    if (!socket || !socket.connected) {
      toast.error("Real-time call server connecting... Please try again in 2 seconds.");
      return;
    }

    setActiveCallType(type);
    setCallState("calling");
    try {
      const stream = await getMediaStream(type === "video");
      setLocalStream(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => setRemoteStream(e.streams[0]);
      pc.onicecandidate = (e) => {
        if (e.candidate && targetUserId) {
          socket.emit("call:ice_candidate", { targetUserId, candidate: e.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:initiate", { targetUserId, offer, callType: type });
      toast.loading(`Calling...`, { id: "call-status" });
    } catch (err) {
      toast.error(`Media access failed: ${err.message}`, { id: "call-status" });
      setCallState("idle");
    }
  };

  const acceptCall = async () => {
    let socket = await ensureSocketConnected();
    if (!incomingCall || !socket) return;
    toast.dismiss("call-status");
    setCallState("connected");
    try {
      const stream = await getMediaStream(incomingCall.callType === "video");
      setLocalStream(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => setRemoteStream(e.streams[0]);
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice_candidate", { targetUserId: incomingCall.callerId, candidate: e.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await processIceQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { callerId: incomingCall.callerId, answer });
    } catch (err) {
      toast.error(`Could not accept call: ${err.message}`);
      rejectCall();
    }
  };

  const rejectCall = () => {
    const socket = getSocket();
    if (incomingCall && socket) socket.emit("call:reject", { callerId: incomingCall.callerId });
    toast.dismiss("call-status");
    endCallCleanup();
  };

  const endCall = () => {
    const socket = getSocket();
    const target = targetUserId || incomingCall?.callerId;
    if (target && socket) socket.emit("call:end", { targetUserId: target });
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

  return {
    startCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleVideo, toggleScreenShare,
    localStream, remoteStream, callState, activeCallType, incomingCall,
    isMuted, isVideoOff, isScreenSharing, callDuration,
  };
};
