import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Trash2, Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import useAiStore from "../../store/aiStore";
import MarkdownMessage from "./MarkdownMessage";
import TypingCursor from "./TypingCursor";
import QuickActions from "./QuickActions";
import { getInitials } from "../../utils/helpers";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const MessageBubble = ({ msg, isLast }) => {
  const isUser = msg.role === "user";
  const { user } = useAuthStore();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(msg.content);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
          {getInitials(user?.name)}
        </div>
      ) : (
        <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={13} className="text-white" />
        </div>
      )}

      <div className={`group max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Bubble */}
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? "bg-brand text-white rounded-tr-sm"
            : msg.isError
              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-error rounded-tl-sm"
              : "bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border text-ink dark:text-slate-200 rounded-tl-sm shadow-xs"
          }`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <>
              <MarkdownMessage content={msg.content} />
              {msg.streaming && msg.content && <TypingCursor />}
              {msg.streaming && !msg.content && (
                <div className="flex gap-1 items-center py-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-brand"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions (visible on hover, only for completed AI messages) */}
        {!isUser && !msg.streaming && msg.content && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copyToClipboard}
              className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-secondary dark:hover:bg-dark-muted transition-colors">
              <Copy size={11} />
            </button>
            {msg.tokensUsed && (
              <span className="text-2xs text-ink-muted px-1">
                {msg.tokensUsed.total} tokens · {msg.durationMs}ms
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AiChatPanel = ({ compact = false, onClose }) => {
  const { messages, isStreaming, sendMessage, clearChat } = useAiStore();
  const [input, setInput]   = useState("");
  const bottomRef           = useRef(null);
  const inputRef            = useRef(null);
  const showQuickActions    = messages.length <= 1 && !isStreaming;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const height = compact ? "h-[480px]" : "h-[calc(100vh-56px)]";

  return (
    <div className={`flex flex-col ${height} ${compact ? "card-glass shadow-xl rounded-2xl overflow-hidden" : ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-dark-border shrink-0
                       ${compact ? "" : "bg-white dark:bg-dark-surface"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Skillora AI</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-2xs text-ink-muted">{isStreaming ? "Thinking..." : "Online"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary dark:hover:bg-dark-muted transition-colors"
            title="Clear chat">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} />
          ))}
        </AnimatePresence>

        {/* Quick actions — shown when chat is fresh */}
        {showQuickActions && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-xs text-ink-muted mb-2 text-center">Quick actions</p>
            <QuickActions onSelect={(prompt) => { sendMessage(prompt); }} />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-surface-border dark:border-dark-border">
        <div className="flex items-end gap-2 bg-white dark:bg-dark-card rounded-xl border border-surface-border dark:border-dark-border
                        focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand transition-all p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your projects..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-ink dark:text-slate-200 placeholder:text-ink-muted
                       outline-none resize-none max-h-32 leading-relaxed"
            style={{ minHeight: "24px" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white
                       disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-600 transition-colors shrink-0"
          >
            {isStreaming ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={13} />
            )}
          </motion.button>
        </div>
        <p className="text-2xs text-ink-muted text-center mt-1.5">
          Press <kbd className="font-medium">Enter</kbd> to send · <kbd className="font-medium">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default AiChatPanel;
