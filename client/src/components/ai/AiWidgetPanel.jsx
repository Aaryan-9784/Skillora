/**
 * AiWidgetPanel — The compact floating chat panel.
 *
 * Glassmorphism dark container with:
 * - Premium header (glowing orb, gradient title, online status)
 * - Scrollable message area with ChatMessage bubbles
 * - SuggestionCards on fresh chat
 * - AIInputBar at the bottom
 */

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, Minimize2 } from "lucide-react";
import useAiStore from "../../store/aiStore";
import useAuthStore from "../../store/authStore";
import ChatMessage from "./ChatMessage";
import WidgetInputBar from "./WidgetInputBar";

const AiWidgetPanel = ({ onClose }) => {
  const { messages, isStreaming, clearChat } = useAiStore();
  const { user } = useAuthStore();
  const bottomRef = useRef(null);
  const isEmptyChat = messages.length <= 1 && !isStreaming;
  const firstName = user?.name ? user.name.split(" ")[0] : "Aryan";

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: "520px",
        borderRadius: "24px",
        background: "rgba(9, 13, 22, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(28px)",
        boxShadow:
          "0 0 0 1px rgba(99, 91, 255, 0.15), 0 32px 64px rgba(0, 0, 0, 0.7), 0 0 80px rgba(99, 91, 255, 0.1)",
      }}
    >
      {/* Top shimmer line */}
      <div
        className="absolute top-0 inset-x-0 h-px rounded-t-[24px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(99,91,255,0.8) 40%, rgba(168,85,247,0.6) 60%, transparent 100%)",
        }}
      />

      {/* ── Header ── */}
      <WidgetHeader onClose={onClose} onClear={clearChat} isStreaming={isStreaming} />

      {/* ── Main Chat Area ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col"
        style={{ scrollbarWidth: "none" }}
      >
        {isEmptyChat ? (
          /* Simple Clean Centered State matching Image 2 */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
            >
              <Sparkles size={24} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="text-xl font-extrabold text-white tracking-tight leading-snug"
            >
              What can I help with today, {firstName}?
            </motion.h2>
          </div>
        ) : (
          /* Active Chat Stream */
          <div className="space-y-4 flex-1">
            <AnimatePresence initial={false}>
              {messages.filter(m => m.id !== "welcome").map((msg) => (
                <ChatMessage key={msg.id} msg={msg} compact />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <WidgetInputBar />
    </div>
  );
};

/* ─── Header sub-component ─── */
const WidgetHeader = ({ onClose, onClear, isStreaming }) => (
  <div
    className="flex items-center justify-between px-4 py-3 shrink-0"
    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
  >
    {/* AI identity */}
    <div className="flex items-center gap-3">
      {/* Glowing orb avatar */}
      <div className="relative">
        {/* Pulse glow */}
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #635BFF, #00D4FF)",
            filter: "blur(8px)",
          }}
        />
        <div
          className="relative w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #635BFF 0%, #8579FF 50%, #00D4FF 100%)",
            boxShadow:
              "0 0 20px rgba(99,91,255,0.5), 0 0 40px rgba(0,212,255,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <Sparkles size={16} className="text-white" strokeWidth={1.8} />
        </div>
        {/* Online dot */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
          style={{
            background: "#22C55E",
            borderColor: "#080E1A",
            boxShadow: "0 0 8px rgba(34,197,94,0.9)",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-full h-full rounded-full"
            style={{ background: "#22C55E" }}
          />
        </div>
      </div>

      {/* Name + status */}
      <div>
        <h2
          className="text-sm font-bold tracking-tight leading-none"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #A78BFA 55%, #00D4FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Skillora AI Studio
        </h2>
        <p className="text-[10px] font-medium text-slate-400 mt-1 leading-none">
          {isStreaming ? "Thinking…" : "Intelligent Workspace Assistant"}
        </p>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1.5">
      {/* Clear chat */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClear}
        title="Clear chat"
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#6B7280" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          e.currentTarget.style.color = "#EF4444";
          e.currentTarget.style.border = "1px solid rgba(239,68,68,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.color = "#6B7280";
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        }}
      >
        <Trash2 size={13} />
      </motion.button>

      {/* Minimize / close */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClose}
        title="Minimize"
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#6B7280" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(99,91,255,0.12)";
          e.currentTarget.style.color = "#A78BFA";
          e.currentTarget.style.border = "1px solid rgba(99,91,255,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.color = "#6B7280";
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        }}
      >
        <Minimize2 size={13} />
      </motion.button>
    </div>
  </div>
);

export default AiWidgetPanel;
