import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SparklineChart } from "./SparklineChart";

const GRADIENTS = {
  brand:   { from: "#635BFF", to: "#8579FF", glow: "rgba(99,91,255,0.35)",  bg: "rgba(99,91,255,0.12)"  },
  success: { from: "#22C55E", to: "#16A34A", glow: "rgba(34,197,94,0.35)",  bg: "rgba(34,197,94,0.12)"  },
  cyan:    { from: "#00D4FF", to: "#0EA5E9", glow: "rgba(0,212,255,0.35)",  bg: "rgba(0,212,255,0.12)"  },
  warning: { from: "#F59E0B", to: "#D97706", glow: "rgba(245,158,11,0.35)", bg: "rgba(245,158,11,0.12)" },
};

const SPARKLINE_DATA = {
  brand:   [2100, 2800, 2400, 3200, 2900, 3800, 3200, 4100, 3600, 4800, 4200, 5200],
  success: [1, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7],
  cyan:    [3, 5, 4, 7, 6, 8, 7, 9, 8, 11, 10, 12],
  warning: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8],
};

const KPIWidget = ({ label, value, icon: Icon, trend, trendLabel, color = "brand", delay = 0 }) => {
  const g       = GRADIENTS[color] || GRADIENTS.brand;
  const isPos   = trend === undefined || trend >= 0;
  const sparkData = SPARKLINE_DATA[color] || SPARKLINE_DATA.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative rounded-2xl p-5 overflow-hidden cursor-default group"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${g.from}40`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${g.from}20, inset 0 1px 0 rgba(255,255,255,0.06)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${g.glow} 0%, transparent 70%)` }} />

      {/* Gradient border top */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${g.from}, transparent)` }} />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: g.bg, boxShadow: `0 0 16px ${g.glow}` }}>
          <Icon size={18} style={{ color: g.from }} strokeWidth={1.8} />
        </div>

        {/* Trend */}
        {trend !== undefined && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: isPos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              border: `1px solid ${isPos ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}>
            {isPos
              ? <TrendingUp size={11} style={{ color: "#22C55E" }} />
              : <TrendingDown size={11} style={{ color: "#EF4444" }} />}
            <span className="text-[11px] font-semibold" style={{ color: isPos ? "#22C55E" : "#EF4444" }}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-1">
        <p className="text-2xl font-bold tracking-tight" style={{ color: "#F9FAFB" }}>{value}</p>
      </div>

      {/* Label + trend label */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm" style={{ color: "#9CA3AF" }}>{label}</p>
        {trendLabel && <p className="text-xs" style={{ color: "#6B7280" }}>{trendLabel}</p>}
      </div>

      {/* Sparkline */}
      <SparklineChart data={sparkData} color={g.from} />
    </motion.div>
  );
};

export default KPIWidget;
