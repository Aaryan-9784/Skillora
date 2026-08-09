import { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic, Download, FileText, ExternalLink } from "lucide-react";

const formatAudioTime = (sec) => {
  if (!sec || isNaN(sec) || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const CustomVoicePlayer = ({ url, duration, isMe }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    if (duration) setTotalDuration(duration);
  }, [duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  return (
    <div className="flex items-center gap-3 py-1.5 px-1 min-w-[210px] sm:min-w-[240px]">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && isFinite(audioRef.current.duration)) {
            setTotalDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        onClick={togglePlay}
        type="button"
        className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
          isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
        }`}
        title={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center space-y-1">
        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (audioRef.current) audioRef.current.currentTime = val;
            setCurrentTime(val);
          }}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none"
        />
        <div className={`flex items-center justify-between text-[10px] font-mono opacity-85 ${isMe ? "text-indigo-100" : "text-slate-300"}`}>
          <span>{formatAudioTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Mic size={10} />
            {formatAudioTime(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const downloadFile = async (url, fileName) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error("Direct download error, opening URL:", e);
    window.open(url, "_blank");
  }
};

export const FileAttachmentCard = ({ att, isMe }) => {
  const fileName = att.fileName || att.filename || "Attachment";
  const ext = fileName.includes(".") ? fileName.split(".").pop().toUpperCase() : "FILE";
  
  const formattedSize = att.sizeBytes
    ? att.sizeBytes > 1024 * 1024
      ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(att.sizeBytes / 1024)} KB`
    : "Document";

  let badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
  if (["PDF"].includes(ext)) {
    badgeColor = "bg-red-500/20 text-red-300 border-red-500/30";
  } else if (["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(ext)) {
    badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
  } else if (["DOC", "DOCX", "TXT"].includes(ext)) {
    badgeColor = "bg-blue-500/20 text-blue-300 border-blue-500/30";
  } else if (["XLS", "XLSX", "CSV"].includes(ext)) {
    badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  }

  const handleOpenPdf = (e) => {
    e.preventDefault();
    window.open(att.url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    downloadFile(att.url, fileName);
  };

  return (
    <div
      onClick={handleOpenPdf}
      title="Click to view/open document in browser"
      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group my-1 ${
        isMe
          ? "bg-white/10 border-white/15 hover:bg-white/20 text-white"
          : "bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-slate-100"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 font-bold text-[11px] ${badgeColor}`}>
        <FileText size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-semibold truncate group-hover:text-indigo-200 transition-colors">
          {fileName}
        </h5>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] opacity-75">
          <span className="font-bold tracking-wide uppercase">{ext}</span>
          <span>•</span>
          <span>{formattedSize}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        title="Download file to computer"
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
          isMe ? "bg-white/15 hover:bg-white/30 text-white" : "bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white"
        }`}
      >
        <Download size={15} />
      </button>
    </div>
  );
};

export const ImageAttachmentCard = ({ att, isMe }) => {
  const fileName = att.fileName || att.filename || "Image";

  return (
    <div className="my-1">
      <a
        href={att.url}
        target="_blank"
        rel="noreferrer"
        className="block relative rounded-xl overflow-hidden border border-white/10 group shadow-lg max-w-xs"
      >
        <img
          src={att.url}
          alt={fileName}
          className="w-full max-h-64 object-cover group-hover:scale-102 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
          <ExternalLink size={18} />
          <span className="text-xs font-bold">View full image</span>
        </div>
      </a>
    </div>
  );
};
