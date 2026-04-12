import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, CheckCheck, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import TypingCursor from "./TypingCursor";
import { getInitials } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";
import useAiStore from "../../store/aiStore";
import toast from "react-hot-toast";

const ChatMessage = ({ msg, compact = false }) => {
  const isUser = msg.role === "user";
  const { user }    = useAuthStore();
  const { sendMessage, messages } = useAiStore();
  const [copied, setCopied]     = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const idx = messages.findIndex(m => m.id === msg.id);
    const prev = [...messages].slice(0, idx).reverse().find(m => m.role === "user");
    if (prev) sendMessage(prev.content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 10px rgba(99,91,255,0.4)" }}>
          {getInitials(user?.name)}
        </div>
      ) : (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.35)" }}>
          <Sparkles size={13} className="text-white" strokeWidth={1.8} />
        </div>
      )}

      {/* Bubble */}
      <div className={`group flex flex-col gap-1 ${isUser ? "items-end max-w-[72%]" : "items-start max-w-[80%]"}`}>
        {isUser ? (
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{
              background: "linear-gradient(135deg,#635BFF,#7C6FFF)",
              color: "#fff",
              boxShadow: "0 2px 16px rgba(99,91,255,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
            {msg.content}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm w-full"
            style={{
              background: msg.isError ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
              border: msg.isError ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}>
            <div className="px-4 py-3 text-sm leading-[1.75]" style={{ color: "#D1D5DB" }}>
              {msg.streaming && !msg.content ? (
                <div className="flex gap-1.5 items-center py-0.5">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#635BFF" }}
                      animate={{ y: [0,-4,0], opacity: [0.4,1,0.4] }}
                      transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.14 }} />
                  ))}
                </div>
              ) : (
                <>
                  <MarkdownMessage content={msg.content} />
                  {msg.streaming && <TypingCursor />}
                </>
              )}
            </div>
          </div>
        )}

        {/* Hover meta row — AI only */}
        {!isUser && !msg.streaming && msg.content && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1 mt-0.5">
            <button onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-all duration-100"
              style={{ color: copied ? "#22C55E" : "#4B5563" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9CA3AF"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = copied ? "#22C55E" : "#4B5563"; }}>
              {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={handleRegenerate}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-all duration-100"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9CA3AF"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}>
              <RotateCcw size={10} />Retry
            </button>
            <div className="flex items-center gap-0.5 ml-0.5">
              {[["up", ThumbsUp], ["down", ThumbsDown]].map(([dir, Icon]) => (
                <button key={dir} onClick={() => setFeedback(dir)}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-100"
                  style={{
                    color: feedback === dir ? (dir === "up" ? "#22C55E" : "#EF4444") : "#4B5563",
                    background: feedback === dir ? (dir === "up" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)") : "transparent",
                  }}
                  onMouseEnter={e => { if (feedback !== dir) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (feedback !== dir) e.currentTarget.style.background = "transparent"; }}>
                  <Icon size={10} />
                </button>
              ))}
            </div>
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
