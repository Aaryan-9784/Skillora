import { useEffect, useRef, useState } from "react";
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
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoFitMode, setVideoFitMode] = useState("cover"); // "cover" | "contain"

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

  // Local webcam video sync
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoOff]);

  // Local screen share stream sync
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      if (screenVideoRef.current.srcObject !== screenStream) {
        screenVideoRef.current.srcObject = screenStream;
      }
      screenVideoRef.current.play().catch(() => {});
    }
  }, [screenStream, isScreenSharing]);

  // Remote video sync
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play().catch((err) => {
        console.warn("[CallModal] Remote video play warning:", err);
      });
    }
  }, [remoteStream, remoteIsSharingScreen]);

  // Remote audio sync (plays remote sound cleanly)
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.play().catch((err) => {
        console.warn("[CallModal] Remote audio play warning:", err);
      });
    }
  }, [remoteStream]);

  if (callState === "idle") return null;

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isVoiceCall = callType === "voice";

  // Check if remote stream has active video track
  const hasRemoteVideo = Boolean(
    remoteStream &&
    remoteStream.getVideoTracks().length > 0 &&
    remoteStream.getVideoTracks().some((t) => t.enabled && t.readyState === "live")
  );

  const isAnyScreenSharing = isScreenSharing || remoteIsSharingScreen;

  return (
    <AnimatePresence>
      {/* ── Incoming Call Prompt Screen ── */}
      {callState === "incoming" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 select-none"
        >
          <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-slate-900/95 border border-white/15 text-center max-w-sm w-full shadow-2xl shadow-indigo-950/50">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center animate-bounce border-2 border-indigo-400/40 shadow-xl overflow-hidden">
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{getInitials(partnerName)}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-4 ring-slate-900 shadow-md">
                {isVoiceCall ? <Phone size={16} /> : <Video size={16} />}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{partnerName}</h3>
              <p className="text-xs text-indigo-400 font-semibold mt-1">
                Incoming {isVoiceCall ? "Voice" : "Video"} Call…
              </p>
            </div>

            <div className="flex items-center gap-6 mt-2">
              <button
                type="button"
                onClick={onReject}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Decline Call"
              >
                <PhoneOff size={22} />
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 animate-pulse transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Accept Call"
              >
                {isVoiceCall ? <Phone size={22} /> : <Video size={22} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Active Calling / Connected Whole-Page Screen ── */}
      {(callState === "connected" || callState === "calling") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none"
        >
          {/* Top Header Bar */}
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
                ref={(el) => {
                  screenVideoRef.current = el;
                  if (el && screenStream && el.srcObject !== screenStream) {
                    el.srcObject = screenStream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
              />
            ) : hasRemoteVideo || remoteIsSharingScreen ? (
              /* Case 2: Remote Peer is sharing screen OR sending camera feed */
              <video
                ref={(el) => {
                  remoteVideoRef.current = el;
                  if (el && remoteStream && el.srcObject !== remoteStream) {
                    el.srcObject = remoteStream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                className={`w-full h-full transition-all duration-300 ${
                  remoteIsSharingScreen || videoFitMode === "contain"
                    ? "object-contain bg-black"
                    : "object-cover"
                }`}
              />
            ) : (
              /* Case 3: Voice Call / Camera Off Avatar Stage */
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-black px-4">
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

            {/* ── Floating Picture-In-Picture (PIP) Window ── */}
            {/* If local user is screen sharing, PIP shows remote partner's face (Google Meet / Zoom pattern) */}
            {isScreenSharing ? (
              <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-8 w-44 sm:w-64 aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 z-20 backdrop-blur-md">
                {hasRemoteVideo ? (
                  <video
                    ref={(el) => {
                      if (el && remoteStream && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                    <User size={24} className="opacity-60" />
                    <span className="text-[11px] font-medium mt-1">{partnerName}</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white">
                  {partnerName}
                </div>
              </div>
            ) : (!isVoiceCall || !isVideoOff || remoteIsSharingScreen) ? (
              /* If remote peer is sharing or it's a video call, PIP shows local webcam */
              <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-8 w-40 sm:w-60 aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 z-20 backdrop-blur-md transition-all hover:scale-105">
                {!isVideoOff && localStream ? (
                  <video
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && localStream && el.srcObject !== localStream) {
                        el.srcObject = localStream;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                    <User size={24} className="opacity-60" />
                    <span className="text-[11px] font-medium mt-1">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white">
                  You
                </div>
              </div>
            ) : null}

            {/* Remote Audio Track Player (Always active to ensure voice is delivered) */}
            {remoteStream && (
              <audio
                ref={(el) => {
                  remoteAudioRef.current = el;
                  if (el && el.srcObject !== remoteStream) {
                    el.srcObject = remoteStream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
              />
            )}
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
                  isVideoOff || (isVoiceCall && !localStream?.getVideoTracks()?.length)
                    ? "bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 ring-2 ring-indigo-400/40"
                }`}
                title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isVideoOff || (isVoiceCall && !localStream?.getVideoTracks()?.length) ? (
                  <VideoOff size={20} />
                ) : (
                  <Video size={20} />
                )}
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
