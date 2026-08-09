import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";

const VoiceRecorder = ({ onSendVoiceNote, onCancel }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration]   = useState(0);
  const mediaRecorderRef          = useRef(null);
  const audioChunksRef            = useRef([]);
  const timerRef                  = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
        } catch {}
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

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start(100);
      setRecording(true);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Failed to start voice recorder:", err);
      onCancel();
    }
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = () => {
      const mime = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });
      onSendVoiceNote(audioBlob, duration);
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    };

    try {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }
      mediaRecorderRef.current.stop();
    } catch (e) {
      console.warn("MediaRecorder stop error:", e);
    }
  };

  const handleCancelRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      } catch {}
    }
    onCancel();
  };

  const formatTimer = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-full select-none">
      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
      <span className="text-xs font-mono font-bold text-white">{formatTimer(duration)}</span>
      <button
        type="button"
        onClick={handleCancelRecording}
        className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
        title="Discard voice note"
      >
        <Trash2 size={14} />
      </button>
      <button
        type="button"
        onClick={stopAndSend}
        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xs font-bold text-white flex items-center gap-1 transition-colors cursor-pointer shadow-md"
      >
        <Send size={12} /> Send
      </button>
    </div>
  );
};

export default VoiceRecorder;
