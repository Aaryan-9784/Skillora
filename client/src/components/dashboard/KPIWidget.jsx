import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const THEMES = {
  brand:   { from: "#635BFF", to: "#A78BFA", glow: "rgba(99,91,255,0.5)",   bg: "rgba(99,91,255,0.1)",   ring: "rgba(99,91,255,0.25)"  },
  success: { from: "#22C55E", to: "#4ADE80", glow: "rgba(34,197,94,0.5)",   bg: "rgba(34,197,94,0.1)",   ring: "rgba(34,197,94,0.25)"  },
  cyan:    { from: "#00D4FF", to: "#38BDF8", glow: "rgba(0,212,255,0.5)",   bg: "rgba(0,212,255,0.1)",   ring: "rgba(0,212,255,0.25)"  },
  warning: { from: "#F59E0B", to: "#FBBF24", glow: "rgba(245,158,11,0.5)",  bg: "rgba(245,158,11,0.1)",  ring: "rgba(245,158,11,0.25)" },
};

const KPIWidget = ({ label, value, icon: Icon, trendLabel, color = "brand" }) => {
  const g = THEMES[color] || THEMES.brand;

  return (
    <div
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

      {/* Top border line */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${g.from} 40%, ${g.to} 60%, transparent 100%)` }} />

      <div className="p-5">
        {/* Top row: icon */}
        <div className="flex items-start justify-between mb-5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${g.bg}, rgba(255,255,255,0.03))`,
                border: `1px solid ${g.ring}`,
                boxShadow: `0 0 20px ${g.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}>
              <Icon size={19} style={{ color: g.from }} strokeWidth={1.7} />
            </div>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `0 0 0 4px ${g.bg}` }} />
          </div>
        </div>

        {/* Value */}
        <p
          className="text-3xl font-extrabold tracking-tight leading-none mb-2"
          style={{
            background: `linear-gradient(135deg, #FFFFFF 30%, ${g.from} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {value}
        </p>

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
    </div>
  );
};

export default KPIWidget;
