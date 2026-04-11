import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, trend, trendLabel, color = "brand", delay = 0 }) => {
  const colors = {
    brand:   { bg: "bg-brand-50 dark:bg-brand/10",   icon: "text-brand",   ring: "ring-brand/20" },
    success: { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-success", ring: "ring-success/20" },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20",     icon: "text-warning", ring: "ring-warning/20" },
    cyan:    { bg: "bg-cyan-50 dark:bg-cyan-900/20",       icon: "text-cyan",    ring: "ring-cyan/20" },
  };
  const c = colors[color] || colors.brand;
  const isPositive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ring-1 ${c.ring}`}>
          <Icon size={18} className={c.icon} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-success" : "text-error"}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-ink dark:text-slate-100 mb-0.5">{value}</p>
      <p className="text-sm text-ink-secondary">{label}</p>
      {trendLabel && <p className="text-xs text-ink-muted mt-1">{trendLabel}</p>}
    </motion.div>
  );
};

export default StatCard;
