import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Pause, Play, Volume2, Square } from "lucide-react";
import { motion } from "framer-motion";

const BAR_COUNT = 28;

// Natural acoustic voice wave profile for paused / static display (varying heights 10px to 30px)
const ACOUSTIC_WAVE = [10, 16, 22, 14, 8, 18, 26, 20, 12, 16, 28, 22, 14, 10, 20, 30, 24, 16, 10, 18, 24, 14, 8, 16, 20, 12, 8, 10];

const VoiceRecorder = ({ onSendVoiceNote, onCancel }) => {
  const [recording, setRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const [waveData, setWaveData] = useState(() => Array(BAR_COUNT).fill(10));
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const previewAudioRef = useRef(null);

  // Dedicated declarative timer effect: ONLY increments duration when actively recording (NOT paused and NOT previewing)
  useEffect(() => {
    let timer = null;
    if (recording && !isPaused && !isPreviewing) {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [recording, isPaused, isPreviewing]);

  // Format seconds to MM:SS
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const cleanupAudioNodes = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      cleanupAudioNodes();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Web Audio API setup for live audio visualizer
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateWave = () => {
          if (analyserRef.current && !isPaused && !isPreviewing) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const step = Math.floor(dataArray.length / BAR_COUNT) || 1;
            const newBars = [];
            for (let i = 0; i < BAR_COUNT; i++) {
              const rawVal = dataArray[i * step] || 0;
              // Normalize value to height between 8px and 30px
              const height = Math.max(8, Math.min(30, Math.round((rawVal / 255) * 30)));
              newBars.push(height);
            }
            setWaveData(newBars);
          }
          animFrameRef.current = requestAnimationFrame(updateWave);
        };
        animFrameRef.current = requestAnimationFrame(updateWave);
      } catch (e) {
        console.warn("AudioContext visualizer initialization failed:", e);
      }

      let options = {};
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          options = { mimeType: "audio/ogg;codecs=opus" };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Failed to start voice recorder:", err);
      onCancel();
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPreviewing) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setIsPreviewing(false);
      setPreviewTime(0);
    }

    if (isPaused) {
      // Resume recording
      try {
        if (mediaRecorderRef.current.state === "paused") {
          mediaRecorderRef.current.resume();
        }
      } catch (e) {
        console.warn("Error resuming recorder:", e);
      }
      setIsPaused(false);
    } else {
      // Pause recording
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.pause();
        }
      } catch (e) {
        console.warn("Error pausing recorder:", e);
      }
      setIsPaused(true);
    }
  };

  const togglePreview = () => {
    if (isPreviewing) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setIsPreviewing(false);
      setPreviewTime(0);
      return;
    }

    // Always pause recording when previewing
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.pause();
      } catch (e) {}
    }
    setIsPaused(true);

    if (audioChunksRef.current.length === 0) return;

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const mime = mediaRecorderRef.current?.mimeType || "audio/webm";
    const previewBlob = new Blob(audioChunksRef.current, { type: mime });
    const url = URL.createObjectURL(previewBlob);
    setAudioUrl(url);

    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.volume = 1.0;

    audio.ontimeupdate = () => {
      if (audio) {
        setPreviewTime(Math.floor(audio.currentTime || 0));
      }
    };

    audio.onended = () => {
      setIsPreviewing(false);
      setPreviewTime(0);
    };

    audio.onerror = (e) => {
      console.error("Audio preview playback error:", e);
      setIsPreviewing(false);
      setPreviewTime(0);
    };

    const p = audio.play();
    if (p !== undefined) {
      p.catch((err) => {
        console.error("Audio preview play failed:", err);
        setIsPreviewing(false);
        setPreviewTime(0);
      });
    }
    setIsPreviewing(true);
  };

  const stopAndSend = () => {
    setRecording(false);
    if (!mediaRecorderRef.current) {
      onCancel();
      return;
    }

    const mime = mediaRecorderRef.current?.mimeType || "audio/webm";

    const finalizeAndSend = () => {
      if (audioChunksRef.current && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        onSendVoiceNote(audioBlob, duration);
      } else {
        onCancel();
      }
      cleanupAudioNodes();
    };

    if (mediaRecorderRef.current.state === "inactive") {
      finalizeAndSend();
      return;
    }

    mediaRecorderRef.current.onstop = () => {
      finalizeAndSend();
    };

    try {
      if (mediaRecorderRef.current.state === "paused") {
        try {
          mediaRecorderRef.current.resume();
        } catch {}
      }
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      } else {
        finalizeAndSend();
      }
    } catch (e) {
      console.warn("MediaRecorder stop exception:", e);
      finalizeAndSend();
    }
  };

  const handleCancelRecording = () => {
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    cleanupAudioNodes();
    onCancel();
  };

  // Determine active waveform bars
  const activeWave = isPaused || isPreviewing ? ACOUSTIC_WAVE : waveData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 bg-[#0f172a] border border-purple-500/40 rounded-2xl shadow-2xl select-none"
    >
      {/* Left: High-Contrast Recording Status Badge & Monospace Timer */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 shadow-md">
          {isPreviewing ? (
            <span className="inline-flex rounded-full h-3 w-3 bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse"></span>
          ) : !isPaused ? (
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_#ef4444]"></span>
            </div>
          ) : (
            <span className="inline-flex rounded-full h-3 w-3 bg-amber-400 shadow-[0_0_10px_#f59e0b]"></span>
          )}
          <span
            className={`text-xs font-black tracking-wider uppercase ${
              isPreviewing
                ? "text-cyan-300"
                : !isPaused
                ? "text-red-400"
                : "text-amber-300"
            }`}
          >
            {isPreviewing ? "PLAYING" : !isPaused ? "REC" : "PAUSED"}
          </span>
        </div>

        {/* Monospace Digital Counter */}
        <div className="font-mono text-xs sm:text-sm font-black text-white tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner min-w-[58px] text-center">
          {formatTimer(isPreviewing ? previewTime : duration)}
        </div>
      </div>

      {/* Center: Dynamic / Acoustic Audio Waveform */}
      <div className="flex-1 flex items-center justify-center gap-[3px] h-8 px-2 overflow-hidden">
        {activeWave.map((height, i) => (
          <div
            key={i}
            style={{ height: `${height}px` }}
            className={`w-[4px] rounded-full transition-all duration-150 ${
              isPreviewing
                ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse"
                : !isPaused
                ? "bg-gradient-to-t from-purple-500 via-indigo-400 to-cyan-300 shadow-[0_0_5px_rgba(168,85,247,0.5)]"
                : "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]"
            }`}
          />
        ))}
      </div>

      {/* Right: Solid High-Contrast Control Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Pause / Resume Button */}
        {!isPreviewing ? (
          !isPaused ? (
            <button
              type="button"
              onClick={togglePause}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md"
              title="Pause recording"
            >
              <Pause size={14} className="fill-white text-white" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePause}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/30"
              title="Resume recording"
            >
              <Play size={14} className="fill-slate-950 text-slate-950" />
              <span>Resume</span>
            </button>
          )
        ) : null}

        {/* Listen Preview / Stop Button */}
        {isPaused && !isPreviewing && (
          <button
            type="button"
            onClick={togglePreview}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/40 border border-indigo-400/30"
            title="Listen to preview"
          >
            <Volume2 size={14} className="text-white" />
            <span>Preview</span>
          </button>
        )}

        {isPreviewing && (
          <button
            type="button"
            onClick={togglePreview}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-400/40"
            title="Stop preview"
          >
            <Square size={13} className="fill-slate-950 text-slate-950" />
            <span>Stop</span>
          </button>
        )}

        {/* Discard Button */}
        <button
          type="button"
          onClick={handleCancelRecording}
          className="p-2 text-slate-300 hover:text-red-400 bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 rounded-xl transition-all cursor-pointer"
          title="Discard recording"
        >
          <Trash2 size={16} />
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={stopAndSend}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/40 active:scale-95 transition-all cursor-pointer border border-purple-400/30"
        >
          <Send size={14} className="fill-white/20 text-white" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </motion.div>
  );
};

export default VoiceRecorder;
