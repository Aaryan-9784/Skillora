import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, CheckCheck, Plus, FolderKanban, FileText } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import TypingCursor from "./TypingCursor";
import { getInitials } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Action buttons shown below AI responses
const ACTION_BUTTONS = [
  { icon: Plus,         label: "Create Task",    path: "/tasks",    color: "#22C55E" },
  { icon: FolderKanban, label: "Add to Project", path: "/projects", color: "#635BFF" },
  { icon: FileText,     label: "Generate Invoice",path: "/payments", color: "#F59E0B" },
];

const ChatMessage = ({ msg }) => {
  const isUser = msg.role === "user";
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg, #635BFF, #8579FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
          {getInitials(user?.name)}
        </div>
      ) : (
        <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg, #635BFF, #00D4FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
          <Sparkles size={14} className="text-white" strokeWidth={1.8} />
        </div>
      )}

      <div className={`group flex flex-col gap-1.5 ${isUser ? "items-end max-w-[75%]" : "items-start max-w-[80%]"}`}>
        {/* Bubble */}
        {isUser ? (
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)",
              boxShadow: "0 4px 16px rgba(99,91,255,0.3)",
              color: "#FFFFFF",
            }}>
            {msg.content}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm overflow-hidden"
            style={{
              background: msg.isError ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
              border: msg.isError ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}>
            <div className="px-4 py-3 text-sm leading-relaxed" style={{ color: "#E5E7EB" }}>
              {msg.streaming && !msg.content ? (
                // Typing dots
                <div className="flex gap-1.5 items-center py-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: "#635BFF" }}
                      animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
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

            {/* Action buttons — shown after streaming completes */}
            {!isUser && !msg.streaming && msg.content && msg.id !== "welcome" && (
              <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                {ACTION_BUTTONS.map((btn) => (
                  <motion.button key={btn.label}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(btn.path)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150"
                    style={{
                      background: `${btn.color}15`,
                      border: `1px solid ${btn.color}30`,
                      color: btn.color,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${btn.color}25`}
                    onMouseLeave={e => e.currentTarget.style.background = `${btn.color}15`}>
                    <btn.icon size={10} />
                    {btn.label}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meta row */}
        {!isUser && !msg.streaming && msg.content && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1">
            <button onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] transition-colors duration-150"
              style={{ color: copied ? "#22C55E" : "#4B5563" }}>
              {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
              {copied ? "Copied" : "Copy"}
            </button>
            {msg.tokensUsed?.total > 0 && (
              <span className="text-[10px]" style={{ color: "#374151" }}>
                {msg.tokensUsed.total} tokens · {msg.durationMs}ms
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
