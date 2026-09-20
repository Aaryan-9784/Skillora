import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Phone,
  Maximize2,
  Minimize2,
  ShieldCheck,
  User,
  Radio,
  Move,
} from "lucide-react";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

const CallModal = ({
  callState,
  callType = "video",
  localStream,
  remoteStream,
  screenStream,
  onEndCall,
  onAccept,
  onReject,
  isMuted,
  isVideoOff,
  isScreenSharing,
  remoteIsSharingScreen,
  presenterName,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  callDuration,
  partnerName = "User",
  partnerAvatar = "",
}) => {
  const containerRef      = useRef(null);
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const screenVideoRef    = useRef(null);
  const remotePipVideoRef = useRef(null);
  const remoteAudioRef    = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoFitMode, setVideoFitMode] = useState("cover"); // "cover" | "contain"
  const [isRemoteVideoLive, setIsRemoteVideoLive] = useState(false);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Track live status of remote video stream
  useEffect(() => {
    if (!remoteStream) {
      setIsRemoteVideoLive(false);
      return;
    }

    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length === 0) {
      setIsRemoteVideoLive(false);
      return;
    }

    const vTrack = videoTracks[0];
    const updateLiveState = () => {
      const isLive = vTrack.readyState === "live" && vTrack.enabled && !vTrack.muted;
      setIsRemoteVideoLive(isLive);
    };

    updateLiveState();
    vTrack.addEventListener("mute", updateLiveState);
    vTrack.addEventListener("unmute", updateLiveState);
    vTrack.addEventListener("ended", updateLiveState);

    return () => {
      vTrack.removeEventListener("mute", updateLiveState);
      vTrack.removeEventListener("unmute", updateLiveState);
      vTrack.removeEventListener("ended", updateLiveState);
    };
  }, [remoteStream]);

  // Local webcam video sync
  useEffect(() => {
    const vEl = localVideoRef.current;
    if (vEl && localStream) {
      vEl.muted = true;
      vEl.defaultMuted = true;
      vEl.playsInline = true;
      if (vEl.srcObject !== localStream) {
        vEl.srcObject = localStream;
      }
      vEl.play().catch(() => {});
    }
  }, [localStream, isVideoOff]);

  // Local screen share stream sync
  useEffect(() => {
    const vEl = screenVideoRef.current;
    if (vEl && screenStream) {
      vEl.muted = true;
      vEl.defaultMuted = true;
      vEl.playsInline = true;
      if (vEl.srcObject !== screenStream) {
        vEl.srcObject = screenStream;
      }
      vEl.play().catch(() => {});
    }
  }, [screenStream, isScreenSharing]);

  // Remote PIP video sync (when screen sharing)
  useEffect(() => {
    const vEl = remotePipVideoRef.current;
    if (vEl && remoteStream && isScreenSharing) {
      vEl.muted = true;
      vEl.defaultMuted = true;
      vEl.playsInline = true;
      if (vEl.srcObject !== remoteStream) {
        vEl.srcObject = remoteStream;
      }
      vEl.play().catch(() => {});
    }
  }, [remoteStream, isScreenSharing]);

  // Remote video sync (ensures muted property is set so Chrome Autoplay Policy never blocks video frames)
  useEffect(() => {
    const vEl = remoteVideoRef.current;
    if (!vEl) return;

    vEl.muted = true;
    vEl.defaultMuted = true;
    vEl.playsInline = true;

    if (remoteStream) {
      if (vEl.srcObject !== remoteStream) {
        vEl.srcObject = remoteStream;
      }
      const playVideo = () => {
        vEl.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.warn("[CallModal] Remote video play warning:", err);
          }
        });
        if (vEl.videoWidth > 0 && vEl.videoHeight > 0) {
          setIsRemoteVideoLive(true);
        }
      };

      vEl.onloadedmetadata = playVideo;
      vEl.oncanplay = playVideo;
      playVideo();
    }
  }, [remoteStream, callState, callType, remoteIsSharingScreen, isScreenSharing]);

  // Remote audio sync (plays remote sound cleanly)
  useEffect(() => {
    const aEl = remoteAudioRef.current;
    if (aEl && remoteStream) {
      aEl.muted = false;
      aEl.defaultMuted = false;
      aEl.volume = 1.0;

      if (aEl.srcObject !== remoteStream) {
        aEl.srcObject = remoteStream;
      }
      const playPromise = aEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[CallModal] Remote audio play warning:", err);
          // Unlock audio playback immediately on user interaction if blocked by browser policy
          const unlock = () => {
            if (aEl) {
              aEl.muted = false;
              aEl.play().catch(() => {});
            }
            window.removeEventListener("click", unlock);
            window.removeEventListener("keydown", unlock);
            window.removeEventListener("touchstart", unlock);
          };
          window.addEventListener("click", unlock, { once: true });
          window.addEventListener("keydown", unlock, { once: true });
          window.addEventListener("touchstart", unlock, { once: true });
        });
      }
    }
  }, [remoteStream, callState]);

  // Dynamic track listener for incoming video tracks
  useEffect(() => {
    if (!remoteStream) return;
    const handleTrackUpdate = () => {
      const vEl = remoteVideoRef.current;
      if (vEl) {
        vEl.srcObject = remoteStream;
        vEl.play().catch(() => {});
      }
      const aEl = remoteAudioRef.current;
      if (aEl) {
        aEl.srcObject = remoteStream;
        aEl.play().catch(() => {});
      }
      const videoTracks = remoteStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const vt = videoTracks[0];
        setIsRemoteVideoLive(vt.readyState === "live" && vt.enabled && !vt.muted);
      } else {
        setIsRemoteVideoLive(false);
      }
    };

    remoteStream.addEventListener("addtrack", handleTrackUpdate);
    remoteStream.addEventListener("removetrack", handleTrackUpdate);

    return () => {
      if (remoteStream) {
        remoteStream.removeEventListener("addtrack", handleTrackUpdate);
        remoteStream.removeEventListener("removetrack", handleTrackUpdate);
      }
    };
  }, [remoteStream]);

  if (callState === "idle") return null;

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Check if remote stream has active video track
  const hasRemoteVideo = Boolean(
    isRemoteVideoLive || (
      remoteStream &&
      remoteStream.getVideoTracks().length > 0 &&
      remoteStream.getVideoTracks().some((t) => t.readyState !== "ended" && t.enabled)
    )
  );
  // Check if local webcam is actively streaming
  const hasLocalVideo = Boolean(
    !isVideoOff &&
    localStream &&
    localStream.getVideoTracks().length > 0 &&
    localStream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
  );
  const isVoiceCall = callType === "voice" && !hasRemoteVideo;
  const isAnyScreenSharing = isScreenSharing || remoteIsSharingScreen;

  const handleAccept = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
      }
    } catch (e) {}
    if (typeof onAccept === "function") {
      onAccept();
    }
  };

  return (
    <AnimatePresence>
      {/* ── Incoming Call Prompt Screen ── */}
      {callState === "incoming" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
        >
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative mx-auto w-24 h-24 rounded-full bg-indigo-600/30 p-1 mb-5 ring-4 ring-indigo-500/30 animate-pulse">
              {partnerAvatar ? (
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                  {getInitials(partnerName)}
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white">{partnerName}</h3>
            <p className="text-sm text-indigo-400 mt-1 capitalize font-medium flex items-center justify-center gap-1.5">
              {isVoiceCall ? <Phone size={15} /> : <Video size={15} />}
              Incoming {isVoiceCall ? "Voice" : "Video"} Call…
            </p>

            <div className="flex items-center justify-center gap-6 mt-8">
              {/* Decline Button */}
              <button
                type="button"
                onClick={onReject}
                className="flex flex-col items-center gap-2 group cursor-pointer"
                title="Decline Call"
              >
                <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 active:scale-95 transition-all">
                  <PhoneOff size={24} />
                </div>
                <span className="text-xs font-semibold text-slate-300">Decline</span>
              </button>

              {/* Accept Button */}
              <button
                type="button"
                onClick={handleAccept}
                className="flex flex-col items-center gap-2 group cursor-pointer"
                title="Accept Call"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 group-hover:scale-110 active:scale-95 transition-all animate-bounce">
                  <Phone size={24} />
                </div>
                <span className="text-xs font-semibold text-emerald-400">Accept</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Active Fullscreen Call Modal (calling or connected) ── */}
      {(callState === "calling" || callState === "connected") && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none"
        >
          {/* Audio Element for Remote Sound (kept active in DOM render tree) */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="absolute bottom-0 left-0 w-px h-px pointer-events-none opacity-[0.01]" />

          {/* Top Control Bar / Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 px-5 sm:px-8 py-4 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/80 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{getInitials(partnerName)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-white leading-none">{partnerName}</h4>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} /> Encrypted
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callState === "connected" ? "bg-emerald-500 animate-pulse" : "bg-indigo-400 animate-ping"
                    }`}
                  />
                  <span className="text-xs font-medium text-slate-300">
                    {callState === "calling" ? "Calling…" : "Connected"}
                  </span>
                  {callState === "connected" && (
                    <>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-xs font-mono font-semibold text-indigo-300">
                        {formatTime(callDuration)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* Fit / Fill toggle button for video feeds */}
              {(hasRemoteVideo || isAnyScreenSharing) && (
                <button
                  type="button"
                  onClick={() => setVideoFitMode((m) => (m === "cover" ? "contain" : "cover"))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-all cursor-pointer backdrop-blur-md"
                  title="Toggle video scale fit/cover"
                >
                  {videoFitMode === "cover" ? "Fit Screen" : "Fill Screen"}
                </button>
              )}

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          {/* Center Main Stage (Fills 100% of the viewport) */}
          <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
            
            {/* ── Screen Share Banners ── */}
            {isScreenSharing && (
              <div className="absolute top-20 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-300 text-xs font-semibold shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Monitor size={15} className="text-emerald-400" />
                <span>You are sharing your screen</span>
                <button
                  type="button"
                  onClick={onToggleScreenShare}
                  className="ml-2 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer transition-all shadow-md shadow-red-600/30"
                >
                  Stop Sharing
                </button>
              </div>
            )}

            {!isScreenSharing && remoteIsSharingScreen && (
              <div className="absolute top-20 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/40 backdrop-blur-md text-indigo-200 text-xs font-semibold shadow-xl">
                <Radio size={14} className="animate-pulse text-indigo-400" />
                <Monitor size={15} className="text-indigo-400" />
                <span>{presenterName || partnerName} is sharing their screen</span>
              </div>
            )}

            {/* ── Main Stage Video Presentation ── */}
            {/* Case 1: Local User is Screen Sharing -> Show local screen share feed */}
            {isScreenSharing && screenStream ? (
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              /* Case 2 & 3: Remote Peer Video / Screen Share or Avatar Stage */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
                {/* Persistent remote video element */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onCanPlay={(e) => e.target.play().catch(() => {})}
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(() => {});
                    if (e.target.videoWidth > 0) setIsRemoteVideoLive(true);
                  }}
                  onPlaying={() => setIsRemoteVideoLive(true)}
                  className={`w-full h-full transition-opacity duration-300 ${
                    remoteIsSharingScreen || videoFitMode === "contain"
                      ? "object-contain bg-black"
                      : "object-cover"
                  } ${
                    hasRemoteVideo || remoteIsSharingScreen
                      ? "opacity-100 relative z-10"
                      : "opacity-0 absolute inset-0 pointer-events-none"
                  }`}
                />

                {/* When remote peer has no video, show elegant Avatar stage */}
                {!hasRemoteVideo && !remoteIsSharingScreen && (
                  <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-black px-4">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-64 h-64 rounded-full bg-indigo-500/10 animate-ping pointer-events-none" />
                      <div className="absolute w-48 h-48 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

                      <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-1 ring-4 ring-indigo-500/30 shadow-2xl shadow-indigo-600/30 overflow-hidden flex items-center justify-center">
                        {partnerAvatar ? (
                          <img src={partnerAvatar} alt={partnerName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-5xl sm:text-6xl font-black text-white">
                            {getInitials(partnerName)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-center mt-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{partnerName}</h2>
                      <p className="text-sm font-medium text-indigo-400 mt-1">
                        {callState === "calling"
                          ? "Calling…"
                          : isVoiceCall
                          ? "Voice Call Connected"
                          : "Camera turned off"}
                      </p>

                      {/* Audio Visualizer Waves */}
                      {callState === "connected" && (
                        <div className="flex items-center justify-center gap-1.5 mt-5">
                          {[12, 24, 36, 20, 30, 16, 28].map((h, i) => (
                            <span
                              key={i}
                              style={{
                                height: `${h}px`,
                                animationDelay: `${i * 0.15}s`,
                              }}
                              className="w-1.5 rounded-full bg-indigo-400/80 animate-pulse"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* ── Floating Draggable Picture-In-Picture (PIP) Window ── */}
              {isScreenSharing ? (
                <motion.div
                  drag
                  dragConstraints={containerRef}
                  dragElastic={0.08}
                  dragMomentum={false}
                  whileDrag={{ scale: 1.05, zIndex: 40 }}
                  className="absolute bottom-24 sm:bottom-28 right-4 sm:right-8 w-44 sm:w-64 aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 z-30 backdrop-blur-md cursor-grab active:cursor-grabbing touch-none select-none group"
                >
                  {hasRemoteVideo ? (
                    <video
                      ref={remotePipVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 pointer-events-none">
                      <User size={24} className="opacity-60" />
                      <span className="text-[11px] font-medium mt-1">{partnerName}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white pointer-events-none">
                    {partnerName}
                  </div>
                  {/* Subtle Drag Handle Indicator on Hover */}
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Move size={12} />
                  </div>
                </motion.div>
              ) : (!isVoiceCall || !isVideoOff || remoteIsSharingScreen) ? (
                <motion.div
                  drag
                  dragConstraints={containerRef}
                  dragElastic={0.08}
                  dragMomentum={false}
                  whileDrag={{ scale: 1.05, zIndex: 40 }}
                  className="absolute bottom-24 sm:bottom-28 right-4 sm:right-8 w-40 sm:w-60 aspect-video rounded-2xl overflow-hidden border border-white/25 shadow-2xl bg-slate-900 z-30 backdrop-blur-md cursor-grab active:cursor-grabbing touch-none select-none group ring-1 ring-white/10"
                >
                  {!isVideoOff && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100 pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 pointer-events-none">
                      <User size={24} className="opacity-60" />
                      <span className="text-[11px] font-medium mt-1">Camera Off</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white pointer-events-none">
                    You
                  </div>
                  {/* Subtle Drag Handle Indicator on Hover */}
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Move size={12} />
                  </div>
                </motion.div>
              ) : null}
          </div>

          {/* ── Bottom Controls Dock Bar (Images 2 & 3 made properly workable) ── */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="flex items-center gap-3 sm:gap-5 px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-slate-900/85 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80">
              
              {/* Microphone Toggle (Mute / Unmute) */}
              <button
                type="button"
                onClick={onToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isMuted
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40"
                    : "bg-white/10 hover:bg-white/20 text-white hover:scale-105 active:scale-95"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Video Camera Toggle (On / Off) */}
              <button
                type="button"
                onClick={onToggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  hasLocalVideo
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 ring-2 ring-indigo-400/40"
                    : "bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
                }`}
                title={hasLocalVideo ? "Turn Camera Off" : "Turn Camera On"}
              >
                {hasLocalVideo ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              {/* Screen Share Toggle (Share Screen / Stop Sharing) */}
              <button
                type="button"
                onClick={onToggleScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isScreenSharing
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 animate-pulse ring-2 ring-emerald-400/40"
                    : "bg-white/10 hover:bg-white/20 text-white hover:scale-105 active:scale-95"
                }`}
                title={isScreenSharing ? "Stop Sharing Screen" : "Share Your Screen"}
              >
                <Monitor size={20} />
              </button>

              {/* End Call Button (Red Hangup) */}
              <button
                type="button"
                onClick={onEndCall}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 hover:scale-108 active:scale-95 transition-all cursor-pointer"
                title="End Call"
              >
                <PhoneOff size={22} />
              </button>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallModal;
