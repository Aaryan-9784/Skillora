import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Clock, Zap } from "lucide-react";
import useAiStore from "../../store/aiStore";
import useDashboardStore from "../../store/dashboardStore";
import AIHeader from "../../components/ai/AIHeader";
import ChatMessage from "../../components/ai/ChatMessage";
import SuggestionCards from "../../components/ai/SuggestionCards";
import AIInputBar from "../../components/ai/AIInputBar";
import ContextPanel from "../../components/ai/ContextPanel";
import HistoryPanel from "../../components/ai/HistoryPanel";
import { formatDate } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// SAVED PROMPTS
// ─────────────────────────────────────────────────────────
const SAVED_PROMPTS = [
  { id: 1, emoji: "📊", title: "Weekly productivity review",   prompt: "Analyze my productivity this week and give me actionable insights" },
  { id: 2, emoji: "📝", title: "Client proposal template",     prompt: "Write a professional client proposal template I can customize" },
  { id: 3, emoji: "⚠️", title: "Project risk assessment",      prompt: "Identify potential risks in my current active projects" },
  { id: 4, emoji: "💰", title: "Pricing strategy review",      prompt: "Review my current pricing and suggest improvements based on market rates" },
  { id: 5, emoji: "🎯", title: "Goal setting for this month",  prompt: "Help me set realistic freelance goals for this month based on my current workload" },
  { id: 6, emoji: "📧", title: "Follow-up email template",     prompt: "Write a professional follow-up email template for clients who haven't responded" },
];

const SavedPromptsPanel = ({ onSelect }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      <p className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: "#374151" }}>
        Saved Prompts
      </p>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {SAVED_PROMPTS.map((p, i) => (
        <motion.button key={p.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          onClick={() => onSelect(p.prompt)}
          className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-150 group"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(99,91,255,0.08)";
            e.currentTarget.style.border = "1px solid rgba(99,91,255,0.25)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
            e.currentTarget.style.boxShadow = "none";
          }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
            {p.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#E5E7EB" }}>{p.title}</p>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6B7280" }}>{p.prompt}</p>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN AI PAGE
// ─────────────────────────────────────────────────────────
const AI = () => {
  const [tab, setTab] = useState("chat");
  const { messages, isStreaming, sendMessage, fetchHistory } = useAiStore();
  const { fetchSummary } = useDashboardStore();
  const bottomRef = useRef(null);

  const showSuggestions = messages.length <= 1 && !isStreaming;

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { if (tab === "history") fetchHistory(); }, [tab]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="flex flex-col h-[calc(100vh-56px)] w-full relative"
      style={{
        background: "radial-gradient(ellipse at 25% 0%, rgba(99,91,255,0.1) 0%, transparent 50%), radial-gradient(ellipse at 75% 100%, rgba(0,212,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.03) 0%, transparent 70%)",
      }}
    >
      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }} />

      {/* ── Header ── */}
      <AIHeader tab={tab} onTabChange={setTab} />

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">

          {/* Chat tab */}
          {tab === "chat" && (
            <motion.div key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* Messages scroll area */}
              <div
                className="flex-1 overflow-y-auto py-6 space-y-5"
                style={{ scrollbarWidth: "none" }}
              >
                <div className="max-w-4xl mx-auto px-6 space-y-5">
                {/* Context panel — fresh chat only */}
                {showSuggestions && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <ContextPanel />
                  </motion.div>
                )}

                {/* Messages */}
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} msg={msg} />
                  ))}
                </AnimatePresence>

                {/* Quick actions — fresh chat only */}
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <SuggestionCards onSelect={(prompt) => sendMessage(prompt)} />
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <AIInputBar />
            </motion.div>
          )}

          {/* History tab */}
          {tab === "history" && (
            <motion.div key="history"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto px-6 py-5"
              style={{ scrollbarWidth: "none" }}
            >
              <HistoryPanel />
            </motion.div>
          )}

          {/* Saved prompts tab */}
          {tab === "saved" && (
            <motion.div key="saved"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto px-6 py-5"
              style={{ scrollbarWidth: "none" }}
            >
              <SavedPromptsPanel onSelect={(prompt) => { sendMessage(prompt); setTab("chat"); }} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default AI;
