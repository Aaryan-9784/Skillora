import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const THEMES = {
  brand:   { from: "#635BFF", to: "#A78BFA", glow: "rgba(99,91,255,0.5)",   bg: "rgba(99,91,255,0.1)",   ring: "rgba(99,91,255,0.25)"  },
  success: { from: "#22C55E", to: "#4ADE80", glow: "rgba(34,197,94,0.5)",   bg: "rgba(34,197,94,0.1)",   ring: "rgba(34,197,94,0.25)"  },
  cyan:    { from: "#00D4FF", to: "#38BDF8", glow: "rgba(0,212,255,0.5)",   bg: "rgba(0,212,255,0.1)",   ring: "rgba(0,212,255,0.25)"  },
  warning: { from: "#F59E0B", to: "#FBBF24", glow: "rgba(245,158,11,0.5)",  bg: "rgba(245,158,11,0.1)",  ring: "rgba(245,158,11,0.25)" },
};

const KPIWidget = ({ label, value, icon: Icon, trend, trendLabel, color = "brand", delay = 0 }) => {
  const g     = THEMES[color] || THEMES.brand;
  const isPos = trend === undefined || trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden cursor-default group"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border 0.22s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${g.ring}`;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${g.ring}, 0 16px 48px rgba(0,0,0,0.45), inset 0 0 60px ${g.bg}`;
        e.currentTarget.style.transform = "translateY(-4px) scale(1.015)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0) scale(1)";
      }}
    >
      {/* Corner glow blob */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${g.glow} 0%, transparent 65%)` }} />

      {/* Bottom-left subtle glow */}
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${g.glow} 0%, transparent 70%)` }} />

      {/* Animated top border line */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${g.from} 40%, ${g.to} 60%, transparent 100%)` }} />



      <div className="p-5">
        {/* Top row: icon + trend */}
        <div className="flex items-start justify-between mb-5">
          {/* Icon with ring */}
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${g.bg}, rgba(255,255,255,0.03))`,
                border: `1px solid ${g.ring}`,
                boxShadow: `0 0 20px ${g.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}>
              <Icon size={19} style={{ color: g.from }} strokeWidth={1.7} />
            </div>
            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `0 0 0 4px ${g.bg}` }} />
          </div>

          {/* Trend badge */}
          {trend !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: isPos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${isPos ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)"}`,
                boxShadow: isPos ? "0 0 12px rgba(34,197,94,0.15)" : "0 0 12px rgba(239,68,68,0.15)",
              }}>
              {isPos
                ? <TrendingUp size={11} style={{ color: "#22C55E" }} />
                : <TrendingDown size={11} style={{ color: "#EF4444" }} />}
              <span className="text-[11px] font-bold tabular-nums" style={{ color: isPos ? "#4ADE80" : "#F87171" }}>
                {isPos ? "+" : "-"}{Math.abs(trend)}%
              </span>
            </motion.div>
          )}
        </div>

        {/* Value — large, gradient text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.15 }}
          className="text-3xl font-extrabold tracking-tight leading-none mb-2"
          style={{
            background: `linear-gradient(135deg, #FFFFFF 30%, ${g.from} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {value}
        </motion.p>

        {/* Label row */}
        <div className="flex items-center justify-between mt-1">
          <p className="text-[13px] font-medium" style={{ color: "#6B7280" }}>{label}</p>
          {trendLabel && (
            <span className="text-[11px] px-2 py-0.5 rounded-lg"
              style={{ color: "#4B5563", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {trendLabel}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default KPIWidget;
