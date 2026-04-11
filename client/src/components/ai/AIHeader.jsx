import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, Bookmark, Trash2, Zap } from "lucide-react";
import useAiStore from "../../store/aiStore";

const TABS = [
  { id: "chat",    label: "Chat",          icon: Sparkles },
  { id: "history", label: "History",       icon: History  },
  { id: "saved",   label: "Saved Prompts", icon: Bookmark },
];

const AIHeader = ({ tab, onTabChange }) => {
  const { isStreaming, clearChat } = useAiStore();

  return (
    <div className="shrink-0 px-6 pt-6 pb-5 relative">
      {/* Ambient header glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,91,255,0.12) 0%, transparent 70%)" }} />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        {/* ── AI Identity ── */}
        <div className="flex items-center gap-4">
          {/* Glowing orb */}
          <div className="relative">
            {/* Outer pulse */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #635BFF, #00D4FF)", filter: "blur(10px)" }}
            />
            {/* Inner pulse */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #635BFF)", filter: "blur(6px)" }}
            />
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #635BFF 0%, #8579FF 50%, #00D4FF 100%)",
                boxShadow: "0 0 28px rgba(99,91,255,0.55), 0 0 56px rgba(0,212,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}>
              <Sparkles size={20} className="text-white" strokeWidth={1.8} />
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
              style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 10px rgba(34,197,94,0.9)" }}>
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full h-full rounded-full"
                style={{ background: "#22C55E" }}
              />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #A78BFA 55%, #00D4FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Skillora AI
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span style={{ color: "#374151" }}>·</span>
              <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "#635BFF" }}>
                <Zap size={9} />
                Gemini 1.5 Pro
              </span>
            </div>
          </div>
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">
          {/* Segmented tab control */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(12px)",
            }}>
            {TABS.map((t) => (
              <motion.button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
                style={{ color: tab === t.id ? "#A78BFA" : "#6B7280" }}
              >
                {/* Sliding pill */}
                {tab === t.id && (
                  <motion.div
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "rgba(99,91,255,0.2)",
                      border: "1px solid rgba(99,91,255,0.3)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <t.icon size={12} />
                  {t.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Clear chat */}
          {tab === "chat" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.border = "1px solid rgba(239,68,68,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; }}
              title="Clear chat"
            >
              <Trash2 size={14} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom separator */}
      <div className="absolute bottom-0 inset-x-6 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.2), rgba(0,212,255,0.15), transparent)" }} />
    </div>
  );
};

export default AIHeader;
