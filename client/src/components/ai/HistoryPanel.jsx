import { motion } from "framer-motion";
import { History, Clock, Zap, Search } from "lucide-react";
import { useState } from "react";
import useAiStore from "../../store/aiStore";
import { formatDate } from "../../utils/helpers";

const FEATURE_COLORS = {
  chat:                { color: "#635BFF", bg: "rgba(99,91,255,0.15)" },
  task_suggestion:     { color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  project_description: { color: "#00D4FF", bg: "rgba(0,212,255,0.15)" },
  invoice_summary:     { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  other:               { color: "#9CA3AF", bg: "rgba(156,163,175,0.15)" },
};

const HistoryPanel = () => {
  const { history } = useAiStore();
  const [search, setSearch] = useState("");

  const filtered = history.filter((log) =>
    !search || log.prompt?.toLowerCase().includes(search.toLowerCase())
  );

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)" }}>
          <History size={20} style={{ color: "#635BFF" }} strokeWidth={1.5} />
        </motion.div>
        <p className="text-sm font-semibold" style={{ color: "#E5E7EB" }}>No history yet</p>
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Your conversations will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4B5563" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#E5E7EB",
          }}
        />
      </div>

      {/* Items */}
      {filtered.map((log, i) => {
        const fc = FEATURE_COLORS[log.feature] || FEATURE_COLORS.other;
        return (
          <motion.div key={log._id || i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl p-4 transition-all duration-150 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.border = "1px solid rgba(99,91,255,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"; }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: fc.bg, color: fc.color }}>
                  {log.feature?.replace("_", " ")}
                </span>
                <span className="text-[10px]" style={{ color: "#4B5563" }}>{formatDate(log.createdAt)}</span>
              </div>
              {log.durationMs && (
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "#4B5563" }}>
                  <Clock size={9} />
                  {log.durationMs}ms
                  {log.tokensUsed?.total > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Zap size={8} style={{ color: "#635BFF" }} />
                      {log.tokensUsed.total}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm font-medium line-clamp-1 mb-1" style={{ color: "#E5E7EB" }}>{log.prompt}</p>
            <p className="text-xs line-clamp-2" style={{ color: "#6B7280" }}>{log.response}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default HistoryPanel;
