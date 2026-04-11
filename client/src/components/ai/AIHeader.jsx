import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, Bookmark, Trash2 } from "lucide-react";
import useAiStore from "../../store/aiStore";

const TABS = [
  { id: "chat",    label: "Chat",          icon: Sparkles },
  { id: "history", label: "History",       icon: History },
  { id: "saved",   label: "Saved Prompts", icon: Bookmark },
];

const AIHeader = ({ tab, onTabChange }) => {
  const { isStreaming, clearChat } = useAiStore();

  return (
    <div className="shrink-0 px-6 pt-6 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Identity */}
        <div className="flex items-center gap-4">
          {/* Glowing orb avatar */}
          <div className="relative">
            {/* Outer pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #635BFF, #00D4FF)", filter: "blur(8px)" }}
            />
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #635BFF 0%, #8579FF 50%, #00D4FF 100%)",
                boxShadow: "0 0 24px rgba(99,91,255,0.5), 0 0 48px rgba(0,212,255,0.2)",
              }}>
              <Sparkles size={20} className="text-white" strokeWidth={1.8} />
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }}>
              <motion.div animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full h-full rounded-full" style={{ background: "#22C55E" }} />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #A78BFA 60%, #00D4FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Skillora AI
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: "#6B7280" }}>Context-aware</span>
              <span style={{ color: "#374151" }}>·</span>
              <span className="text-xs font-medium" style={{ color: "#635BFF" }}>Powered by Gemini 1.5 Pro</span>
            </div>
          </div>
        </div>

        {/* Right: tabs + clear */}
        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => onTabChange(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: tab === t.id ? "rgba(99,91,255,0.2)" : "transparent",
                  color:      tab === t.id ? "#A78BFA" : "#6B7280",
                  border:     tab === t.id ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                }}>
                <t.icon size={12} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Clear chat */}
          {tab === "chat" && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#6B7280"; }}
              title="Clear chat">
              <Trash2 size={14} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIHeader;
