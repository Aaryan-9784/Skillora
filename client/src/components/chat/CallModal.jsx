import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from "lucide-react";

const CallModal = ({
  callState,
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

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">

        {/* Incoming Call Screen */}
        {callState === "incoming" && (
          <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-slate-900 border border-white/10 text-center max-w-sm w-full shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-indigo-600/30 flex items-center justify-center animate-bounce border border-indigo-500/40">
              <Video size={36} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{partnerName}</h3>
              <p className="text-xs text-slate-400 mt-1">Incoming Call…</p>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <button onClick={onReject} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transition-all">
                <PhoneOff size={22} />
              </button>
              <button onClick={onAccept} className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 animate-pulse transition-all">
                <Video size={22} />
              </button>
            </div>
          </div>
        )}

        {/* Active Connected / Calling Screen */}
        {(callState === "connected" || callState === "calling") && (
          <div className="relative w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden bg-slate-950 border border-white/10 flex flex-col shadow-2xl">
            
            {/* Call Header */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-white">{partnerName}</span>
              <span className="text-xs font-mono text-slate-300">{formatTime(callDuration)}</span>
            </div>

            {/* Video Feed Layout */}
            <div className="relative flex-1 bg-black">
              {/* Remote Stream (Main Screen) */}
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              
              {/* Local Stream (PIP Corner Window) */}
              <div className="absolute bottom-6 right-6 w-48 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-slate-900/90 border-t border-white/10 flex items-center justify-center gap-4">
              <button onClick={onToggleMute} className={`p-3 rounded-full transition-all ${isMuted ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button onClick={onToggleVideo} className={`p-3 rounded-full transition-all ${isVideoOff ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
              <button onClick={onToggleScreenShare} className={`p-3 rounded-full transition-all ${isScreenSharing ? "bg-emerald-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                <Monitor size={18} />
              </button>
              <button onClick={onEndCall} className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30">
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CallModal;
