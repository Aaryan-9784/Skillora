import { motion } from "framer-motion";
import { Sparkles, History, Trash2, Zap } from "lucide-react";
import useAiStore from "../../store/aiStore";

const TABS = [
  { id: "chat",    label: "Chat",    icon: Sparkles },
  { id: "history", label: "History", icon: History  },
];

const AIHeader = ({ tab, onTabChange }) => {
  const { clearChat } = useAiStore();

  return (
    <div className="shrink-0 relative">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ opacity: [0.3, 0.65, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-xl"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", filter: "blur(8px)", transform: "scale(1.2)" }}
            />
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#635BFF 0%,#8579FF 100%)",
                boxShadow: "0 0 20px rgba(99,91,255,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}>
              <Sparkles size={16} className="text-white" strokeWidth={1.8} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: "#F9FAFB" }}>Skillora AI</p>
            <p className="text-[10px] flex items-center gap-1" style={{ color: "#635BFF" }}>
              <Zap size={8} />Gemini 1.5 Pro
            </p>
          </div>
        </div>

        {/* Right: tabs + clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {TABS.map((t) => (
              <motion.button key={t.id} onClick={() => onTabChange(t.id)} whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ color: tab === t.id ? "#A78BFA" : "#6B7280" }}>
                {tab === t.id && (
                  <motion.div layoutId="ai-tab"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "rgba(99,91,255,0.18)", border: "1px solid rgba(99,91,255,0.28)" }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <t.icon size={11} />{t.label}
                </span>
              </motion.button>
            ))}
          </div>

          {tab === "chat" && (
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={clearChat}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#4B5563" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#4B5563"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              title="Clear chat">
              <Trash2 size={13} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.18),transparent)" }} />
    </div>
  );
};

export default AIHeader;
