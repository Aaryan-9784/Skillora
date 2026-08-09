import { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic, Download, FileText, ExternalLink, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export const getMediaUrl = (url) => {
  if (!url) return "";
  let finalUrl = url;

  if (finalUrl.includes("cloudinary.com")) {
    // Fix potential double extensions in Cloudinary public IDs
    finalUrl = finalUrl.replace(/\.webm\.webm$/i, ".webm");
    // If raw upload was used for audio formats, transform path to /video/upload/ for browser HTML5 streaming
    if (finalUrl.includes("/raw/upload/") && finalUrl.match(/\.(webm|wav|mp3|ogg|m4a|aac)$/i)) {
      finalUrl = finalUrl.replace("/raw/upload/", "/video/upload/");
    }
    // If url lacks extension but is video/audio upload on cloudinary, append .webm for HTML5 audio player
    if (finalUrl.includes("/video/upload/") && !finalUrl.match(/\.(webm|wav|mp3|ogg|m4a|aac|mp4)$/i)) {
      finalUrl = `${finalUrl}.webm`;
    }
  }

  if (finalUrl.startsWith("http://") || finalUrl.startsWith("https://") || finalUrl.startsWith("blob:") || finalUrl.startsWith("data:")) {
    return finalUrl;
  }
  const backendUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
  return `${backendUrl.replace(/\/$/, "")}/${finalUrl.replace(/^\//, "")}`;
};

const formatAudioTime = (sec) => {
  if (!sec || isNaN(sec) || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const CustomVoicePlayer = ({ url, duration, isMe }) => {
  const fullUrl = getMediaUrl(url);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(() => Number(duration) || 0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (duration && Number(duration) > 0) {
      setTotalDuration(Number(duration));
    }
  }, [url, duration]);

  const updateDuration = () => {
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setTotalDuration(audioRef.current.duration);
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!audioRef.current) return;

    if (hasError) {
      toast.error("Audio format not supported or file unavailable");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
          setHasError(true);
        });
      }
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const maxVal = totalDuration > 0 ? totalDuration : 1;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
    }
  }, []);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 py-1.5 px-1 min-w-[210px] sm:min-w-[240px] select-none"
    >
      <audio
        ref={audioRef}
        src={fullUrl}
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setHasError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime || 0);
            updateDuration();
          }
        }}
        onLoadedMetadata={updateDuration}
        onDurationChange={updateDuration}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlaying(false);
          setHasError(true);
        }}
      />

      <button
        onClick={togglePlay}
        type="button"
        className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${
          hasError
            ? "bg-red-500/80 text-white"
            : isMe
            ? "bg-white/25 hover:bg-white/35 text-white"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
        }`}
        title={hasError ? "Audio unavailable" : isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {hasError ? <AlertCircle size={15} /> : isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center space-y-1 min-w-0">
        <input
          type="range"
          min={0}
          max={maxVal}
          step={0.05}
          disabled={hasError}
          value={Math.min(currentTime, maxVal)}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none disabled:opacity-50"
        />
        <div className={`flex items-center justify-between text-[10px] font-mono opacity-90 ${isMe ? "text-indigo-100" : "text-slate-300"}`}>
          <span>{hasError ? "Unavailable" : formatAudioTime(currentTime)}</span>
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
  if (!url) return;
  const fullUrl = getMediaUrl(url);
  const name = fileName || "download";

  // If it's a Cloudinary URL, use fl_attachment transformation to trigger direct browser download
  if (fullUrl.includes("cloudinary.com") && fullUrl.includes("/upload/")) {
    const downloadUrl = fullUrl.replace("/upload/", "/upload/fl_attachment/");
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Try direct fetch blob download for standard URLs
  try {
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (e) {
    console.warn("Direct blob download failed, fallback to direct anchor:", e);
    const a = document.createElement("a");
    a.href = fullUrl;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export const FileAttachmentCard = ({ att, isMe }) => {
  const fileName = att.fileName || att.filename || att.name || "Attachment";
  const ext = fileName.includes(".") ? fileName.split(".").pop().toUpperCase() : "FILE";
  const fullUrl = getMediaUrl(att.url);

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
    if (fullUrl) {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
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
  const fileName = att.fileName || att.filename || att.name || "Image";
  const fullUrl = getMediaUrl(att.url);

  return (
    <div className="my-1">
      <a
        href={fullUrl}
        target="_blank"
        rel="noreferrer"
        className="block relative rounded-xl overflow-hidden border border-white/10 group shadow-lg max-w-xs"
      >
        <img
          src={fullUrl}
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
