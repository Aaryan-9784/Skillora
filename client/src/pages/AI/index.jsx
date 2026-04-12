import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAiStore from "../../store/aiStore";
import useDashboardStore from "../../store/dashboardStore";
import useAuthStore from "../../store/authStore";
import AIHeader from "../../components/ai/AIHeader";
import ChatMessage from "../../components/ai/ChatMessage";
import AIInputBar from "../../components/ai/AIInputBar";
import HistoryPanel from "../../components/ai/HistoryPanel";

// ── Minimal suggestion chips shown on fresh chat ──
const CHIPS = [
  { label: "Plan my day",          prompt: "Help me plan my day based on my current projects and tasks" },
  { label: "Create task list",     prompt: "Break down my current project into specific actionable tasks" },
  { label: "Analyze productivity", prompt: "Analyze my productivity and give me 5 specific improvements" },
  { label: "Write a proposal",     prompt: "Write a professional client proposal template I can customize" },
  { label: "Pricing advice",       prompt: "Based on my skills and projects, what should I charge?" },
];

const WelcomeState = ({ onSelect, userName }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center flex-1 px-6 pb-8 text-center"
  >
    {/* Greeting */}
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-2xl font-semibold mb-2 tracking-tight"
      style={{ color: "#F9FAFB" }}
    >
      Hi {userName} — how can I help you?
    </motion.p>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.18 }}
      className="text-sm mb-8"
      style={{ color: "#4B5563" }}
    >
      Ask anything about your work, or pick a suggestion below.
    </motion.p>

    {/* Suggestion chips */}
    <div className="flex flex-wrap justify-center gap-2 max-w-lg">
      {CHIPS.map((c, i) => (
        <motion.button
          key={c.label}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.22 + i * 0.06, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => onSelect(c.prompt)}
          className="px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "#9CA3AF",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(99,91,255,0.12)";
            e.currentTarget.style.borderColor = "rgba(99,91,255,0.3)";
            e.currentTarget.style.color = "#C4B5FD";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
            e.currentTarget.style.color = "#9CA3AF";
          }}
        >
          {c.label}
        </motion.button>
      ))}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// MAIN AI PAGE
// ─────────────────────────────────────────────────────────
const AI = () => {
  const [tab, setTab]   = useState("chat");
  const { messages, isStreaming, sendMessage, fetchHistory } = useAiStore();
  const { fetchSummary } = useDashboardStore();
  const { user }         = useAuthStore();
  const bottomRef        = useRef(null);
  const isEmpty          = messages.length === 0 || (messages.length === 1 && messages[0].id === "welcome");
  const showWelcome      = isEmpty && !isStreaming;

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { if (tab === "history") fetchHistory(); }, [tab]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full relative"
      style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(99,91,255,0.07) 0%, transparent 55%)" }}>

      {/* Header */}
      <AIHeader tab={tab} onTabChange={setTab} />

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">

          {/* Chat */}
          {tab === "chat" && (
            <motion.div key="chat"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {showWelcome ? (
                <WelcomeState
                  userName={user?.name?.split(" ")[0] || "there"}
                  onSelect={(p) => sendMessage(p)}
                />
              ) : (
                <div className="flex-1 overflow-y-auto py-6" style={{ scrollbarWidth: "none" }}>
                  <div className="max-w-3xl mx-auto px-6 space-y-6">
                    <AnimatePresence initial={false}>
                      {messages.map(msg => (
                        <ChatMessage key={msg.id} msg={msg} />
                      ))}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                  </div>
                </div>
              )}

              <AIInputBar />
            </motion.div>
          )}

          {/* History */}
          {tab === "history" && (
            <motion.div key="history"
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto py-6"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="max-w-3xl mx-auto px-6">
                <HistoryPanel />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default AI;
