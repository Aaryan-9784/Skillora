import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic } from "lucide-react";
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
  const [focused, setFocused] = useState(false);
  const [slash, setSlash]     = useState([]);
  const inputRef = useRef(null);

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
        <div className="relative rounded-2xl transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: focused ? "1px solid rgba(99,91,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
            boxShadow: focused
              ? "0 0 0 3px rgba(99,91,255,0.08), 0 8px 32px rgba(0,0,0,0.25)"
              : "0 2px 12px rgba(0,0,0,0.15)",
          }}>

          {/* Focus top glow */}
          {focused && (
            <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl pointer-events-none"
              style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.55),rgba(139,92,246,0.4),transparent)" }} />
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask anything about your work…"
            rows={1}
            className="w-full bg-transparent px-4 pt-4 pb-2 text-sm outline-none resize-none leading-relaxed"
            style={{ color: "#F9FAFB", minHeight: "24px", maxHeight: "120px" }}
          />

          <div className="flex items-center gap-1.5 px-3 pb-3">
            {/* Slash hint */}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{ color: "#374151", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              /
            </span>
            <span className="text-[10px]" style={{ color: "#374151" }}>for commands</span>

            <div className="flex-1" />

            {/* Mic */}
            <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
              style={{ color: "#374151" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#374151"; e.currentTarget.style.background = "transparent"; }}>
              <Mic size={13} />
            </button>

            {/* Send */}
            <motion.button
              whileHover={canSend ? { scale: 1.06 } : {}}
              whileTap={canSend ? { scale: 0.94 } : {}}
              onClick={handleSend}
              disabled={!canSend}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{
                background: canSend ? "linear-gradient(135deg,#635BFF,#8579FF)" : "rgba(255,255,255,0.05)",
                boxShadow: canSend ? "0 0 14px rgba(99,91,255,0.4)" : "none",
                color: canSend ? "#fff" : "#374151",
              }}>
              {isStreaming
                ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={13} strokeWidth={2} />
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
