import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import useAiStore from "../../store/aiStore";
import useDashboardStore from "../../store/dashboardStore";
import AIHeader from "../../components/ai/AIHeader";
import ChatMessage from "../../components/ai/ChatMessage";
import SuggestionCards from "../../components/ai/SuggestionCards";
import AIInputBar from "../../components/ai/AIInputBar";
import ContextPanel from "../../components/ai/ContextPanel";
import HistoryPanel from "../../components/ai/HistoryPanel";

// ── Saved prompts (static for now) ───────────────────────
const SAVED_PROMPTS = [
  { id: 1, title: "Weekly productivity review",   prompt: "Analyze my productivity this week and give me actionable insights" },
  { id: 2, title: "Client proposal template",     prompt: "Write a professional client proposal template I can customize" },
  { id: 3, title: "Project risk assessment",      prompt: "Identify potential risks in my current active projects" },
  { id: 4, title: "Pricing strategy review",      prompt: "Review my current pricing and suggest improvements based on market rates" },
];

const SavedPromptsPanel = ({ onSelect }) => (
  <div className="space-y-2.5">
    <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#4B5563" }}>
      Saved Prompts
    </p>
    {SAVED_PROMPTS.map((p, i) => (
      <motion.button key={p.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => onSelect(p.prompt)}
        className="w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-150"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.08)"; e.currentTarget.style.border = "1px solid rgba(99,91,255,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"; }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
          <span className="text-sm">💾</span>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "#E5E7EB" }}>{p.title}</p>
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6B7280" }}>{p.prompt}</p>
        </div>
      </motion.button>
    ))}
  </div>
);

// ── Main AI Page ──────────────────────────────────────────
const AI = () => {
  const [tab, setTab] = useState("chat");
  const { messages, isStreaming, sendMessage, fetchHistory } = useAiStore();
  const { fetchSummary } = useDashboardStore();
  const bottomRef = useRef(null);

  const showSuggestions = messages.length <= 1 && !isStreaming;

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] max-w-3xl mx-auto"
      style={{
        background: "radial-gradient(ellipse at 30% 0%, rgba(99,91,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(0,212,255,0.04) 0%, transparent 60%)",
      }}>

      {/* Header */}
      <AIHeader tab={tab} onTabChange={setTab} />

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── Chat tab ─────────────────────────────── */}
          {tab === "chat" && (
            <motion.div key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>

                {/* Context panel — shown at top of fresh chat */}
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

                {/* Suggestion cards — shown when chat is fresh */}
                {showSuggestions && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <SuggestionCards onSelect={(prompt) => sendMessage(prompt)} />
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <AIInputBar />
            </motion.div>
          )}

          {/* ── History tab ──────────────────────────── */}
          {tab === "history" && (
            <motion.div key="history"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto px-6 py-4">
              <HistoryPanel />
            </motion.div>
          )}

          {/* ── Saved prompts tab ─────────────────────── */}
          {tab === "saved" && (
            <motion.div key="saved"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto px-6 py-4">
              <SavedPromptsPanel onSelect={(prompt) => { sendMessage(prompt); setTab("chat"); }} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default AI;
