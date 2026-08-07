/**
 * WidgetInputBar — Compact glass input for the floating AI widget.
 *
 * Features:
 * - Auto-resizing textarea (max 3 lines)
 * - Enter = send, Shift+Enter = new line
 * - Slash command suggestions (/plan /tasks /proposal /pricing /analyze /insights)
 * - Gradient send button with glow when active
 * - Mic icon (UI only — voice hook-ready)
 * - Focus ring glow
 */

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Paperclip, Globe, FileText, X } from "lucide-react";
import useAiStore from "../../store/aiStore";
import toast from "react-hot-toast";

const SLASH_COMMANDS = [
  { cmd: "/plan",     desc: "Generate a project plan",   prompt: "Generate a detailed project plan for my most recent active project" },
  { cmd: "/tasks",    desc: "Create task list",           prompt: "Break down my current project into specific actionable tasks with priorities" },
  { cmd: "/proposal", desc: "Write client proposal",     prompt: "Write a professional client proposal template I can customize" },
  { cmd: "/pricing",  desc: "Get pricing advice",        prompt: "Based on my skills and projects, what should I charge for my services?" },
  { cmd: "/code",     desc: "Review or refactor code",   prompt: "Review my code snippet for performance optimizations, security, and clean architecture" },
];

const WidgetInputBar = () => {
  const { sendMessage, isStreaming } = useAiStore();
  const [input, setInput] = useState("");
  const [slashHints, setSlashHints] = useState([]);
  const [focused, setFocused] = useState(false);
  const [webSearchEnabled, setWebSearch] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("Listening... Speak into your microphone");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          toast.success("Voice transcribed successfully!");
        }
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
        toast.error("Voice input error. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      toast.error("Could not access microphone.");
    }
  };
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      toast.success(`Attached file: ${file.name}`);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/")) {
      setSlashHints(SLASH_COMMANDS.filter((c) => c.cmd.startsWith(val.toLowerCase())));
    } else {
      setSlashHints([]);
    }

    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
  };

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !attachedFile) || isStreaming) return;

    let finalPrompt = text;
    if (webSearchEnabled) {
      finalPrompt = `[Live Web Search Enabled] ${finalPrompt}`;
    }
    if (attachedFile) {
      finalPrompt = `[Attachment: ${attachedFile.name}]\n${finalPrompt}`;
    }

    const slashMatch = SLASH_COMMANDS.find((c) => c.cmd === text.toLowerCase());
    sendMessage(slashMatch ? slashMatch.prompt : finalPrompt);

    setInput("");
    setAttachedFile(null);
    setSlashHints([]);
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setSlashHints([]);
  };

  const selectSlash = (cmd) => {
    const match = SLASH_COMMANDS.find((c) => c.cmd === cmd);
    if (match) {
      setInput(match.prompt);
      setSlashHints([]);
      inputRef.current?.focus();
    }
  };

  const canSend = (input.trim().length > 0 || attachedFile) && !isStreaming;

  return (
    <div className="shrink-0 px-3 pb-3 pt-2 border-t border-slate-800/60 bg-[#0B0F1A]/95">
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Attachment Chip Preview */}
      {attachedFile && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-[11px] text-indigo-300 w-fit mb-2">
          <FileText size={13} />
          <span className="font-semibold truncate max-w-[180px]">{attachedFile.name}</span>
          <button onClick={() => setAttachedFile(null)} className="hover:text-white cursor-pointer ml-1">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Slash suggestions */}
      <AnimatePresence>
        {slashHints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mb-2 rounded-2xl overflow-hidden bg-[#121829] border border-slate-700/80 shadow-2xl"
          >
            {slashHints.map((s) => (
              <button
                key={s.cmd}
                onClick={() => selectSlash(s.cmd)}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-slate-800/70 transition-colors"
              >
                <span className="text-xs font-mono font-bold text-indigo-400">{s.cmd}</span>
                <span className="text-xs text-slate-400">{s.desc}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rounded Input Container (Identical layout & icons to Image 2) */}
      <div
        className={`relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${
          focused
            ? "bg-[#111726] border border-indigo-500/60 shadow-lg shadow-indigo-500/10"
            : "bg-[#111726]/90 border border-slate-700/60 hover:border-slate-600"
        }`}
      >
        {/* Paperclip / File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer shrink-0"
          title="Attach file"
        >
          <Paperclip size={16} />
        </button>

        {/* Globe / Web Search Toggle */}
        <button
          type="button"
          onClick={() => {
            setWebSearch(!webSearchEnabled);
            toast.success(webSearchEnabled ? "Web search disabled" : "Live web search enabled");
          }}
          className={`p-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
            webSearchEnabled
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title="Toggle live web search"
        >
          <Globe size={16} />
        </button>

        {/* Mic / Voice Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`p-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
            isListening
              ? "bg-red-500/30 text-red-400 border border-red-500/50 animate-pulse shadow-sm shadow-red-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title={isListening ? "Listening... Click to stop" : "Voice input"}
        >
          <Mic size={16} className={isListening ? "animate-bounce" : ""} />
        </button>

        {/* Text Input Field */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Message Skillora AI..."
          rows={1}
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none resize-none max-h-24 py-1 leading-relaxed"
        />

        {/* Send Button (Purple Gradient Circle) */}
        <motion.button
          whileHover={canSend ? { scale: 1.08 } : {}}
          whileTap={canSend ? { scale: 0.92 } : {}}
          onClick={handleSend}
          disabled={!canSend}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all shrink-0 ${
            canSend
              ? "bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/40 cursor-pointer"
              : "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
          }`}
        >
          {isStreaming ? (
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={13} className="ml-0.5" />
          )}
        </motion.button>
      </div>

      {/* Footer Subtext */}
      <p className="text-center text-[10px] text-slate-500 mt-1.5 font-medium">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};

export default WidgetInputBar;
