import { useRef, useState, useEffect, useCallback } from "react";
import { getSocket } from "../services/socketService";
import { RTC_CONFIG } from "../utils/webrtcConfig";

export const useWebRTC = (targetUserId, defaultCallType = "video") => {
  const [localStream, setLocalStream]       = useState(null);
  const [remoteStream, setRemoteStream]     = useState(null);
  const [callState, setCallState]           = useState("idle"); // idle | calling | incoming | connected | ended
  const [incomingCall, setIncomingCall]     = useState(null);   // { callerId, offer, callType }
  const [isMuted, setIsMuted]               = useState(false);
  const [isVideoOff, setIsVideoOff]         = useState(false);
  const [isScreenSharing, setIsScreenShare] = useState(false);
  const [callDuration, setCallDuration]     = useState(0);

  const peerConnectionRef = useRef(null);
  const timerRef          = useRef(null);
  const screenTrackRef    = useRef(null);
  const socket            = getSocket();

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
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setIncomingCall(null);
    setIsScreenShare(false);
  }, [localStream]);

  useEffect(() => {
    if (!socket) return;

    const onIncoming = ({ callerId, offer, callType, projectId }) => {
      setIncomingCall({ callerId, offer, callType, projectId });
      setCallState("incoming");
    };

    const onAnswered = async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState("connected");
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ICE candidate:", e);
        }
      }
    };

    const onRejected = () => {
      alert("Call rejected");
      endCallCleanup();
    };

    const onEnded = () => endCallCleanup();

    socket.on("call:incoming",      onIncoming);
    socket.on("call:answered",      onAnswered);
    socket.on("call:ice_candidate", onIceCandidate);
    socket.on("call:rejected",      onRejected);
    socket.on("call:ended",         onEnded);

    return () => {
      socket.off("call:incoming",      onIncoming);
      socket.off("call:answered",      onAnswered);
      socket.off("call:ice_candidate", onIceCandidate);
      socket.off("call:rejected",      onRejected);
      socket.off("call:ended",         onEnded);
    };
  }, [socket, endCallCleanup]);

  const startCall = async (type = defaultCallType) => {
    setCallState("calling");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => setRemoteStream(e.streams[0]);
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("call:ice_candidate", { targetUserId, candidate: e.candidate });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:initiate", { targetUserId, offer, callType: type });
    } catch (err) {
      alert(`Could not start media: ${err.message}`);
      setCallState("idle");
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    setCallState("connected");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === "video",
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => setRemoteStream(e.streams[0]);
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("call:ice_candidate", { targetUserId: incomingCall.callerId, candidate: e.candidate });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { callerId: incomingCall.callerId, answer });
    } catch (err) {
      alert(`Could not accept call: ${err.message}`);
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall) socket.emit("call:reject", { callerId: incomingCall.callerId });
    endCallCleanup();
  };

  const endCall = () => {
    const target = targetUserId || incomingCall?.callerId;
    if (target) socket.emit("call:end", { targetUserId: target });
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
    localStream, remoteStream, callState, incomingCall,
    isMuted, isVideoOff, isScreenSharing, callDuration,
  };
};
