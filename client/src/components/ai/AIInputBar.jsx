import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Paperclip, ChevronDown, Zap, BarChart2, MessageSquare } from "lucide-react";
import useAiStore from "../../store/aiStore";

const MODES = [
  { id: "chat",    label: "Chat",    icon: MessageSquare, color: "#635BFF" },
  { id: "plan",    label: "Plan",    icon: Zap,           color: "#22C55E" },
  { id: "analyze", label: "Analyze", icon: BarChart2,     color: "#F59E0B" },
];

// Slash command suggestions
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
  const [input, setInput]       = useState("");
  const [mode, setMode]         = useState("chat");
  const [modeOpen, setModeOpen] = useState(false);
  const [focused, setFocused]   = useState(false);
  const [slashSuggestions, setSlashSuggestions] = useState([]);
  const inputRef = useRef(null);

  const currentMode = MODES.find((m) => m.id === mode) || MODES[0];

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    // Show slash suggestions
    if (val.startsWith("/") && val.length > 0) {
      const filtered = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(val.toLowerCase()));
      setSlashSuggestions(filtered);
    } else {
      setSlashSuggestions([]);
    }
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const prompt = SLASH_PROMPTS[input.trim()] || input.trim();
    sendMessage(prompt, mode);
    setInput("");
    setSlashSuggestions([]);
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setSlashSuggestions([]);
  };

  const selectSlash = (cmd) => {
    const prompt = SLASH_PROMPTS[cmd] || cmd;
    setInput(prompt);
    setSlashSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="shrink-0 px-6 pb-6 pt-3">
      {/* Slash suggestions */}
      <AnimatePresence>
        {slashSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10,17,32,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
            }}>
            {slashSuggestions.map((s) => (
              <button key={s.cmd} onClick={() => selectSlash(s.cmd)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span className="text-xs font-mono font-semibold" style={{ color: "#635BFF" }}>{s.cmd}</span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{s.desc}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input container */}
      <div
        className="relative rounded-2xl transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: focused ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          boxShadow: focused ? "0 0 0 3px rgba(99,91,255,0.1), 0 8px 32px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        {/* Top glow when focused */}
        {focused && (
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.6), rgba(0,212,255,0.4), transparent)" }} />
        )}

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything about your work… or type / for commands"
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm outline-none resize-none leading-relaxed"
          style={{
            color: "#F9FAFB",
            minHeight: "24px",
            maxHeight: "120px",
          }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center gap-2 px-3 pb-3">
          {/* Mode selector */}
          <div className="relative">
            <button onClick={() => setModeOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
              style={{
                background: `${currentMode.color}15`,
                border: `1px solid ${currentMode.color}30`,
                color: currentMode.color,
              }}>
              <currentMode.icon size={11} />
              {currentMode.label}
              <ChevronDown size={10} />
            </button>

            <AnimatePresence>
              {modeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setModeOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-full mb-2 left-0 z-20 rounded-xl overflow-hidden w-36"
                    style={{
                      background: "rgba(10,17,32,0.98)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}>
                    {MODES.map((m) => (
                      <button key={m.id} onClick={() => { setMode(m.id); setModeOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors duration-100"
                        style={{ color: mode === m.id ? m.color : "#9CA3AF" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <m.icon size={12} style={{ color: m.color }} />
                        {m.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Attach */}
          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: "#4B5563" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#9CA3AF"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}
            title="Attach file">
            <Paperclip size={13} />
          </button>

          {/* Voice */}
          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: "#4B5563" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#9CA3AF"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}
            title="Voice input">
            <Mic size={13} />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Send */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all duration-150"
            style={{
              background: input.trim() && !isStreaming
                ? "linear-gradient(135deg, #635BFF, #8579FF)"
                : "rgba(255,255,255,0.06)",
              boxShadow: input.trim() && !isStreaming ? "0 0 16px rgba(99,91,255,0.4)" : "none",
              color: input.trim() && !isStreaming ? "#FFFFFF" : "#4B5563",
            }}>
            {isStreaming ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={13} strokeWidth={2} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[10px] mt-2" style={{ color: "#374151" }}>
        Press <kbd className="font-mono" style={{ color: "#4B5563" }}>Enter</kbd> to send ·{" "}
        <kbd className="font-mono" style={{ color: "#4B5563" }}>Shift+Enter</kbd> for new line ·{" "}
        Type <kbd className="font-mono" style={{ color: "#635BFF" }}>/</kbd> for commands
      </p>
    </div>
  );
};

export default AIInputBar;
