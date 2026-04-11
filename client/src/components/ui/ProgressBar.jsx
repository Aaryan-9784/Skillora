import { motion } from "framer-motion";

const ProgressBar = ({ value = 0, size = "md", showLabel = false, color = "brand", className = "" }) => {
  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2.5" };
  const colors  = {
    brand:   "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    error:   "bg-error",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-surface-border dark:bg-dark-border rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${colors[color] || colors.brand}`}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-ink-secondary w-8 text-right">{value}%</span>
      )}
    </div>
  );
};

export default ProgressBar;
