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
import { Send, Mic } from "lucide-react";
import useAiStore from "../../store/aiStore";

const SLASH_COMMANDS = [
  { cmd: "/plan",     desc: "Generate a project plan",   prompt: "Generate a detailed project plan for my most recent active project" },
  { cmd: "/tasks",    desc: "Create task list",           prompt: "Break down my current project into specific actionable tasks with priorities" },
  { cmd: "/proposal", desc: "Write client proposal",     prompt: "Write a professional client proposal template I can customize" },
  { cmd: "/pricing",  desc: "Get pricing advice",        prompt: "Based on my skills and projects, what should I charge for my services?" },
  { cmd: "/analyze",  desc: "Analyze productivity",      prompt: "Analyze my productivity and give me 5 specific improvements I can make" },
  { cmd: "/insights", desc: "Business insights",         prompt: "What are the biggest opportunities to grow my freelance business right now?" },
];

const WidgetInputBar = () => {
  const { sendMessage, isStreaming } = useAiStore();
  const [input,    setInput]    = useState("");
  const [focused,  setFocused]  = useState(false);
  const [slashHints, setSlashHints] = useState([]);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);

    // Slash command suggestions
    if (val.startsWith("/")) {
      setSlashHints(SLASH_COMMANDS.filter((c) => c.cmd.startsWith(val.toLowerCase())));
    } else {
      setSlashHints([]);
    }

    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    // Resolve slash command to full prompt
    const slashMatch = SLASH_COMMANDS.find((c) => c.cmd === input.trim().toLowerCase());
    sendMessage(slashMatch ? slashMatch.prompt : input.trim());
    setInput("");
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

  const canSend = input.trim().length > 0 && !isStreaming;

  return (
    <div
      className="shrink-0 px-3 pb-3 pt-2"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Slash suggestions */}
      <AnimatePresence>
        {slashHints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="mb-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8,14,26,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {slashHints.map((s) => (
              <button
                key={s.cmd}
                onClick={() => selectSlash(s.cmd)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,91,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="text-xs font-mono font-bold" style={{ color: "#635BFF" }}>
                  {s.cmd}
                </span>
                <span className="text-xs" style={{ color: "#6B7280" }}>
                  {s.desc}
                </span>
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
          border: focused
            ? "1px solid rgba(99,91,255,0.45)"
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: focused
            ? "0 0 0 3px rgba(99,91,255,0.1), 0 4px 20px rgba(0,0,0,0.3)"
            : "0 2px 12px rgba(0,0,0,0.2)",
        }}
      >
        {/* Focus top glow */}
        {focused && (
          <div
            className="absolute top-0 inset-x-0 h-px rounded-t-2xl pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(99,91,255,0.7), rgba(0,212,255,0.4), transparent)",
            }}
          />
        )}

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything about your projects…"
          rows={1}
          className="w-full bg-transparent px-4 pt-3 pb-2 text-sm outline-none resize-none leading-relaxed"
          style={{
            color: "#F9FAFB",
            minHeight: "24px",
            maxHeight: "96px",
          }}
        />

        {/* Toolbar row */}
        <div className="flex items-center gap-1.5 px-3 pb-2.5">
          {/* Slash hint badge */}
          <span
            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
            style={{
              background: "rgba(99,91,255,0.1)",
              color: "#635BFF",
              border: "1px solid rgba(99,91,255,0.2)",
            }}
          >
            /
          </span>
          <span className="text-[9px]" style={{ color: "#374151" }}>
            commands
          </span>

          <div className="flex-1" />

          {/* Mic */}
          <button
            className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{ color: "#4B5563" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#9CA3AF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#4B5563";
            }}
            title="Voice input"
          >
            <Mic size={12} />
          </button>

          {/* Send */}
          <motion.button
            whileHover={canSend ? { scale: 1.08 } : {}}
            whileTap={canSend ? { scale: 0.92 } : {}}
            onClick={handleSend}
            disabled={!canSend}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all duration-200"
            style={{
              background: canSend
                ? "linear-gradient(135deg, #635BFF, #8579FF)"
                : "rgba(255,255,255,0.06)",
              boxShadow: canSend ? "0 0 16px rgba(99,91,255,0.45)" : "none",
              color: canSend ? "#FFFFFF" : "#374151",
            }}
          >
            {isStreaming ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={12} strokeWidth={2.5} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[9px] mt-1.5" style={{ color: "#1F2937" }}>
        <kbd style={{ color: "#374151" }}>Enter</kbd> to send ·{" "}
        <kbd style={{ color: "#374151" }}>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
};

export default WidgetInputBar;
