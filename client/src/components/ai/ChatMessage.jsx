import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, CheckCheck, Plus, FolderKanban, FileText, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import TypingCursor from "./TypingCursor";
import { getInitials } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";
import useAiStore from "../../store/aiStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ACTION_BUTTONS = [
  { icon: Plus,         label: "Create Task",     path: "/tasks",    color: "#22C55E" },
  { icon: FolderKanban, label: "Add to Project",  path: "/projects", color: "#635BFF" },
  { icon: FileText,     label: "New Invoice",     path: "/payments", color: "#F59E0B" },
];

const ChatMessage = ({ msg }) => {
  const isUser = msg.role === "user";
  const { user }    = useAuthStore();
  const { sendMessage, messages } = useAiStore();
  const navigate    = useNavigate();
  const [copied, setCopied]     = useState(false);
  const [feedback, setFeedback] = useState(null); // "up" | "down"

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    // Find the last user message before this AI message
    const msgIndex = messages.findIndex(m => m.id === msg.id);
    const prevUser = [...messages].slice(0, msgIndex).reverse().find(m => m.role === "user");
    if (prevUser) sendMessage(prevUser.content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* ── Avatar ── */}
      {isUser ? (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
          style={{
            background: "linear-gradient(135deg, #635BFF, #8579FF)",
            boxShadow: "0 0 12px rgba(99,91,255,0.45)",
          }}>
          {getInitials(user?.name)}
        </div>
      ) : (
        <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: "linear-gradient(135deg, #635BFF, #00D4FF)",
            boxShadow: "0 0 14px rgba(99,91,255,0.5)",
          }}>
          <Sparkles size={14} className="text-white" strokeWidth={1.8} />
        </div>
      )}

      {/* ── Bubble ── */}
      <div className={`group flex flex-col gap-1.5 ${isUser ? "items-end max-w-[75%]" : "items-start max-w-[82%]"}`}>
        {isUser ? (
          /* User bubble */
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)",
              boxShadow: "0 4px 20px rgba(99,91,255,0.35)",
              color: "#FFFFFF",
            }}>
            {msg.content}
          </div>
        ) : (
          /* AI bubble */
          <div className="rounded-2xl rounded-tl-sm overflow-hidden w-full"
            style={{
              background: msg.isError
                ? "rgba(239,68,68,0.08)"
                : "rgba(255,255,255,0.04)",
              border: msg.isError
                ? "1px solid rgba(239,68,68,0.2)"
                : "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            }}>

            {/* Message content */}
            <div className="px-4 py-3.5 text-sm leading-relaxed" style={{ color: "#E5E7EB" }}>
              {msg.streaming && !msg.content ? (
                /* Typing dots */
                <div className="flex gap-1.5 items-center py-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: "#635BFF" }}
                      animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              ) : (
                <>
                  <MarkdownMessage content={msg.content} />
                  {msg.streaming && <TypingCursor />}
                </>
              )}
            </div>

            {/* Action buttons */}
            {!isUser && !msg.streaming && msg.content && msg.id !== "welcome" && (
              <div className="flex items-center gap-2 px-4 pb-3.5 flex-wrap"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                {ACTION_BUTTONS.map((btn) => (
                  <motion.button key={btn.label}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(btn.path)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150"
                    style={{ background: `${btn.color}12`, border: `1px solid ${btn.color}28`, color: btn.color }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${btn.color}22`; e.currentTarget.style.boxShadow = `0 0 10px ${btn.color}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${btn.color}12`; e.currentTarget.style.boxShadow = "none"; }}>
                    <btn.icon size={10} />
                    {btn.label}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Meta row (hover) ── */}
        {!isUser && !msg.streaming && msg.content && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
            {/* Copy */}
            <button onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all duration-100"
              style={{ color: copied ? "#22C55E" : "#4B5563", background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
              {copied ? "Copied" : "Copy"}
            </button>

            {/* Regenerate */}
            <button onClick={handleRegenerate}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all duration-100"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9CA3AF"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}>
              <RotateCcw size={10} />
              Retry
            </button>

            {/* Feedback */}
            <div className="flex items-center gap-1 ml-1">
              {[["up", ThumbsUp], ["down", ThumbsDown]].map(([dir, Icon]) => (
                <button key={dir} onClick={() => setFeedback(dir)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
                  style={{
                    color: feedback === dir ? (dir === "up" ? "#22C55E" : "#EF4444") : "#4B5563",
                    background: feedback === dir ? (dir === "up" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "transparent",
                  }}
                  onMouseEnter={e => { if (feedback !== dir) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (feedback !== dir) e.currentTarget.style.background = "transparent"; }}>
                  <Icon size={10} />
                </button>
              ))}
            </div>

            {/* Token info */}
            {msg.tokensUsed?.total > 0 && (
              <span className="text-[9px] ml-1" style={{ color: "#374151" }}>
                {msg.tokensUsed.total}t · {msg.durationMs}ms
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
