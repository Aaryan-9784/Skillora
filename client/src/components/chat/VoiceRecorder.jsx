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
    return () => clearInterval(timerRef.current);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = undefined;
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) options = { mimeType: "audio/webm;codecs=opus" };
        else if (MediaRecorder.isTypeSupported("audio/webm")) options = { mimeType: "audio/webm" };
        else if (MediaRecorder.isTypeSupported("audio/mp4")) options = { mimeType: "audio/mp4" };
        else if (MediaRecorder.isTypeSupported("audio/ogg")) options = { mimeType: "audio/ogg" };
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setRecording(true);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      onCancel();
    }
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(timerRef.current);
    mediaRecorderRef.current.onstop = () => {
      const mime = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });
      onSendVoiceNote(audioBlob, duration);
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current.stop();
  };

  const formatTimer = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-full">
      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
      <span className="text-xs font-mono font-bold text-white">{formatTimer(duration)}</span>
      <button type="button" onClick={onCancel} className="p-1 text-slate-400 hover:text-red-400">
        <Trash2 size={14} />
      </button>
      <button type="button" onClick={stopAndSend} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
        <Send size={12} /> Send
      </button>
    </div>
  );
};

export default VoiceRecorder;
