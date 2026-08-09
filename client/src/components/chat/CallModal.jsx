import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Phone } from "lucide-react";

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

const CallModal = ({
  callState,
  callType = "video",
  localStream,
  remoteStream,
  onEndCall,
  onAccept,
  onReject,
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  callDuration,
  partnerName = "User",
  partnerAvatar = "",
}) => {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (callState === "idle") return null;

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isVoiceCall = callType === "voice";

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4">

        {/* Incoming Call Screen */}
        {callState === "incoming" && (
          <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-slate-900 border border-white/10 text-center max-w-sm w-full shadow-2xl">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center animate-bounce border-2 border-indigo-400/40 shadow-xl overflow-hidden">
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">{getInitials(partnerName)}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-4 ring-slate-900">
                {isVoiceCall ? <Phone size={16} /> : <Video size={16} />}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{partnerName}</h3>
              <p className="text-xs text-indigo-400 font-semibold mt-1">
                Incoming {isVoiceCall ? "Voice" : "Video"} Call…
              </p>
            </div>

            <div className="flex items-center gap-6 mt-2">
              <button onClick={onReject} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer">
                <PhoneOff size={22} />
              </button>
              <button onClick={onAccept} className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 animate-pulse transition-all cursor-pointer">
                {isVoiceCall ? <Phone size={22} /> : <Video size={22} />}
              </button>
            </div>
          </div>
        )}

        {/* Active Connected / Calling Screen */}
        {(callState === "connected" || callState === "calling") && (
          <div className="relative w-full max-w-4xl h-[75vh] rounded-3xl overflow-hidden bg-slate-950 border border-white/10 flex flex-col shadow-2xl">
            
            {/* Call Header */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-white">{partnerName}</span>
              <span className="text-xs font-mono text-indigo-300">{formatTime(callDuration)}</span>
            </div>

            {/* Video / Voice Audio Feed Layout */}
            <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-center overflow-hidden">
              
              {/* Voice Call Avatar UI */}
              {(isVoiceCall || isVideoOff) ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center border-4 border-indigo-500/40 shadow-2xl overflow-hidden ring-4 ring-indigo-500/20">
                      {partnerAvatar ? (
                        <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-black text-white">{getInitials(partnerName)}</span>
                      )}
                    </div>
                    {callState === "connected" && (
                      <div className="absolute -inset-3 rounded-full border-2 border-indigo-500/40 animate-ping pointer-events-none" />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{partnerName}</h3>
                    <p className="text-xs text-indigo-400 font-medium">
                      {callState === "calling" ? "Calling..." : isVoiceCall ? "Voice Call Connected" : "Video Off"}
                    </p>
                  </div>
                </div>
              ) : (
                /* Remote Video Stream (Main Window) */
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              )}
              
              {/* Hidden audio element for remote stream in voice mode */}
              {isVoiceCall && remoteStream && (
                <audio ref={(el) => { if (el) el.srcObject = remoteStream; }} autoPlay />
              )}

              {/* Local Stream PIP Window (For Video Calls) */}
              {!isVoiceCall && !isVideoOff && (
                <div className="absolute bottom-6 right-6 w-44 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Action Control Bar */}
            <div className="p-4 bg-slate-900/90 border-t border-white/10 flex items-center justify-center gap-4">
              <button
                onClick={onToggleMute}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${isMuted ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {!isVoiceCall && (
                <button
                  onClick={onToggleVideo}
                  className={`p-3.5 rounded-full transition-all cursor-pointer ${isVideoOff ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                  title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              {!isVoiceCall && (
                <button
                  onClick={onToggleScreenShare}
                  className={`p-3.5 rounded-full transition-all cursor-pointer ${isScreenSharing ? "bg-emerald-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                  title="Share Screen"
                >
                  <Monitor size={20} />
                </button>
              )}

              <button
                onClick={onEndCall}
                className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 cursor-pointer transition-all"
                title="End Call"
              >
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CallModal;
