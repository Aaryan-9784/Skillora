import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, WifiOff } from "lucide-react";
import useAutoRefresh from "../../hooks/useAutoRefresh";

export const LiveSyncIndicator = ({ className = "" }) => {
  const { isRefreshing, lastRefreshedAt, isOnline, refreshNow } = useAutoRefresh();
  const [timeAgo, setTimeAgo] = useState("Just now");
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const updateLabel = () => {
      const diffSec = Math.floor((Date.now() - lastRefreshedAt) / 1000);
      if (diffSec < 10) {
        setTimeAgo("Just now");
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setTimeAgo(`${diffMin}m ago`);
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 5000);
    return () => clearInterval(interval);
  }, [lastRefreshedAt]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => refreshNow()}
        disabled={isRefreshing}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title="Real-time live sync. Click to refresh now."
        className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none"
        style={{
          background: isRefreshing
            ? "rgba(99, 91, 255, 0.16)"
            : "rgba(255, 255, 255, 0.04)",
          border: isRefreshing
            ? "1px solid rgba(99, 91, 255, 0.4)"
            : "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: isRefreshing
            ? "0 0 12px rgba(99, 91, 255, 0.25)"
            : "none",
        }}
      >
        {/* Status indicator dot */}
        {isOnline ? (
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isRefreshing ? "bg-indigo-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isRefreshing ? "bg-indigo-500" : "bg-emerald-500"
              }`}
              style={{
                boxShadow: isRefreshing
                  ? "0 0 6px #635BFF"
                  : "0 0 6px #10B981",
              }}
            />
          </span>
        ) : (
          <WifiOff size={12} className="text-amber-400" />
        )}

        {/* Refresh Icon */}
        <RefreshCw
          size={11}
          className={`transition-all duration-300 ${
            isRefreshing
              ? "animate-spin text-indigo-400"
              : "text-gray-400 group-hover:text-gray-200"
          }`}
        />

        {/* Text label */}
        <span
          className={`text-[11px] tracking-tight font-medium hidden md:inline-block ${
            isRefreshing
              ? "text-indigo-300 font-semibold"
              : "text-gray-400 group-hover:text-gray-200"
          }`}
        >
          {isRefreshing ? "Syncing..." : isOnline ? "Live" : "Offline"}
        </span>
      </motion.button>

      {/* Floating tooltip on hover */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute right-0 top-full mt-2 z-50 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-200 whitespace-nowrap shadow-xl"
            style={{
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(99, 91, 255, 0.2)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Real-time Sync Active</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Updated: {timeAgo} • Click to refresh
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveSyncIndicator;
