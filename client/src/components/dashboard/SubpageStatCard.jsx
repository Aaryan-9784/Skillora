import { motion } from "framer-motion";

const COLOR_MAP = {
  green:   { border: "rgba(34,197,94,0.3)",   bg: "rgba(34,197,94,0.12)",   text: "#22C55E", glow: "rgba(34,197,94,0.2)"  },
  success: { border: "rgba(34,197,94,0.3)",   bg: "rgba(34,197,94,0.12)",   text: "#22C55E", glow: "rgba(34,197,94,0.2)"  },
  purple:  { border: "rgba(139,92,246,0.3)",  bg: "rgba(139,92,246,0.12)",  text: "#A78BFA", glow: "rgba(139,92,246,0.2)" },
  brand:   { border: "rgba(99,91,255,0.3)",   bg: "rgba(99,91,255,0.12)",   text: "#635BFF", glow: "rgba(99,91,255,0.2)"  },
  red:     { border: "rgba(239,68,68,0.3)",   bg: "rgba(239,68,68,0.12)",   text: "#EF4444", glow: "rgba(239,68,68,0.2)"  },
  danger:  { border: "rgba(239,68,68,0.3)",   bg: "rgba(239,68,68,0.12)",   text: "#EF4444", glow: "rgba(239,68,68,0.2)"  },
  cyan:    { border: "rgba(0,212,255,0.3)",   bg: "rgba(0,212,255,0.12)",   text: "#00D4FF", glow: "rgba(0,212,255,0.2)"  },
  amber:   { border: "rgba(245,158,11,0.3)",  bg: "rgba(245,158,11,0.12)",  text: "#F59E0B", glow: "rgba(245,158,11,0.2)" },
  warning: { border: "rgba(245,158,11,0.3)",  bg: "rgba(245,158,11,0.12)",  text: "#F59E0B", glow: "rgba(245,158,11,0.2)" },
  blue:    { border: "rgba(59,130,246,0.3)",  bg: "rgba(59,130,246,0.12)",  text: "#60A5FA", glow: "rgba(59,130,246,0.2)" },
};

const SubpageStatCard = ({
  label,
  value,
  icon: Icon,
  subtext,
  sub,
  trend,
  trendType = "up",
  color = "purple",
  delay = 0,
}) => {
  const theme = COLOR_MAP[color] || (color?.startsWith?.("#")
    ? { border: `${color}4D`, bg: `${color}1F`, text: color, glow: `${color}33` }
    : COLOR_MAP.purple);
  const displaySubtext = subtext || sub;

  // Determine dynamic font size for value based on character length
  const valStr = String(value ?? "");
  const valueFontSize = valStr.length > 12 
    ? "text-lg font-black" 
    : valStr.length > 7 
    ? "text-xl lg:text-2xl font-black" 
    : "text-2xl lg:text-3xl font-extrabold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: `0 8px 30px ${theme.glow}` }}
      className="relative rounded-2xl p-5 overflow-hidden flex flex-col justify-between cursor-default transition-all duration-200 h-full min-h-[135px]"
      style={{
        background: "linear-gradient(145deg, rgba(15,23,42,0.85) 0%, rgba(10,15,26,0.92) 100%)",
        border: `1px solid ${theme.border}`,
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Top Shimmer Accent Line */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.text}60, transparent)` }}
      />

      {/* Top Row: Label on left, Icon on right */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-wide text-slate-400 truncate pr-2">
          {label}
        </span>
        {Icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              boxShadow: `0 0 14px ${theme.glow}`,
            }}
          >
            <Icon size={16} style={{ color: theme.text }} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Middle Row: Large Value */}
      <div className="my-auto py-1">
        <h4 className={`${valueFontSize} tracking-tight text-white truncate`}>
          {value}
        </h4>
      </div>

      {/* Bottom Row: Subtext on left, Trend badge on right */}
      <div className="flex items-center justify-between mt-1 text-xs min-h-[18px]">
        {displaySubtext ? (
          <span className="text-slate-500 text-[11px] truncate font-medium">
            {displaySubtext}
          </span>
        ) : (
          <span />
        )}
        {trend !== undefined && trend !== null && (
          <span
            className="px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ml-2"
            style={{
              background: trendType === "down" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
              color: trendType === "down" ? "#EF4444" : "#22C55E",
              border: trendType === "down" ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(34,197,94,0.25)",
            }}
          >
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default SubpageStatCard;
