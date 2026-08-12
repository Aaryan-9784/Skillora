import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic } from "lucide-react";
import toast from "react-hot-toast";
import useAiStore from "../../store/aiStore";

const SLASH_COMMANDS = [
  { cmd: "/plan",     desc: "Generate a project plan" },
  { cmd: "/tasks",    desc: "Create task list" },
  { cmd: "/proposal", desc: "Write client proposal" },
  { cmd: "/pricing",  desc: "Get pricing advice" },
  { cmd: "/analyze",  desc: "Analyze productivity" },
  { cmd: "/invoice",  desc: "Generate invoice" },
];

const SLASH_PROMPTS = {
  "/plan":     "Generate a detailed project plan for my most recent active project",
  "/tasks":    "Break down my current project into specific actionable tasks with priorities",
  "/proposal": "Write a professional client proposal template I can customize",
  "/pricing":  "Based on my skills and projects, what should I charge for my services?",
  "/analyze":  "Analyze my productivity and give me 5 specific improvements",
  "/invoice":  "Help me create a professional invoice for my latest project",
};

const AIInputBar = () => {
  const { sendMessage, isStreaming } = useAiStore();
  const [input, setInput]     = useState("");
  const [slash, setSlash]     = useState([]);
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);

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

      recognition.onerror = () => {
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

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setSlash(val.startsWith("/") ? SLASH_COMMANDS.filter(c => c.cmd.startsWith(val.toLowerCase())) : []);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(SLASH_PROMPTS[input.trim()] || input.trim());
    setInput("");
    setSlash([]);
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setSlash([]);
  };

  const canSend = input.trim() && !isStreaming;

  return (
    <div className="shrink-0">
      <div className="max-w-3xl mx-auto px-6 pb-6 pt-2">

        {/* Slash suggestions */}
        <AnimatePresence>
          {slash.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="mb-2 rounded-xl overflow-hidden"
              style={{
                background: "rgba(8,14,26,0.97)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
              }}>
              {slash.map(s => (
                <button key={s.cmd}
                  onClick={() => { setInput(SLASH_PROMPTS[s.cmd] || s.cmd); setSlash([]); inputRef.current?.focus(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span className="text-xs font-mono font-semibold" style={{ color: "#635BFF" }}>{s.cmd}</span>
                  <span className="text-xs" style={{ color: "#6B7280" }}>{s.desc}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box */}
        <div className={`relative flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200 ${
          focused
            ? "bg-[#0B0F19] border border-indigo-500/80 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20"
            : "bg-[#0B0F19]/95 border border-indigo-500/40 hover:border-indigo-500/60 shadow-md"
        }`}>

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Message Skillora AI..."
            rows={1}
            className="flex-1 bg-transparent text-xs lg:text-sm text-slate-100 placeholder:text-slate-400 outline-none resize-none max-h-28 py-1.5 px-2 leading-relaxed"
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* Mic */}
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? "Listening... Click to stop" : "Voice input"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                isListening ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}>
              <Mic size={14} className={isListening ? "animate-bounce" : ""} />
            </button>

            {/* Send */}
            <motion.button
              whileHover={canSend ? { scale: 1.08 } : {}}
              whileTap={canSend ? { scale: 0.92 } : {}}
              onClick={handleSend}
              disabled={!canSend}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shrink-0 ${
                canSend
                  ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 shadow-md shadow-purple-600/40 cursor-pointer"
                  : "bg-purple-950/40 text-slate-500 border border-purple-500/20 opacity-50 cursor-not-allowed"
              }`}>
              {isStreaming
                ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} className="ml-0.5" />
              }
            </motion.button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] mt-2" style={{ color: "#1F2937" }}>
          <kbd style={{ color: "#374151" }}>Enter</kbd> to send ·{" "}
          <kbd style={{ color: "#374151" }}>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default AIInputBar;
