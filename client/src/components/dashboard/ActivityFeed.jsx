import { motion } from "framer-motion";
import { FolderKanban, CheckSquare, FileText, UserPlus, CreditCard, Sparkles } from "lucide-react";

const ACTIVITY = [
  {
    id: 1, icon: FolderKanban, text: "Created project E-commerce Redesign",
    time: "15m ago", color: "#635BFF", bg: "rgba(99,91,255,0.15)", group: "Today",
  },
  {
    id: 2, icon: CheckSquare, text: "Completed task: API integration",
    time: "1h ago", color: "#22C55E", bg: "rgba(34,197,94,0.15)", group: "Today",
  },
  {
    id: 3, icon: FileText, text: "Invoice #INV-004 sent to Acme Corp",
    time: "3h ago", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", group: "Today",
  },
  {
    id: 4, icon: UserPlus, text: "Added new client: TechStart Inc",
    time: "8h ago", color: "#00D4FF", bg: "rgba(0,212,255,0.15)", group: "Today",
  },
  {
    id: 5, icon: CreditCard, text: "Payment received: ₹12,000",
    time: "1d ago", color: "#22C55E", bg: "rgba(34,197,94,0.15)", group: "Yesterday",
  },
  {
    id: 6, icon: Sparkles, text: "AI generated 6 tasks for Mobile App",
    time: "1d ago", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", group: "Yesterday",
  },
];

const groups = [...new Set(ACTIVITY.map((a) => a.group))];

const ActivityFeed = () => (
  <div
    className="relative rounded-2xl flex flex-col"
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(12px)",
      // match the chart card height
      height: "100%",
      minHeight: 0,
    }}
  >
    {/* Header — fixed, never scrolls */}
    <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
      <h3 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>Recent Activity</h3>
      <div className="relative w-2.5 h-2.5">
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: "#22C55E" }}
          animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Solid dot */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }} />
      </div>
    </div>

    {/* Scrollable feed — takes remaining height, hides scrollbar */}
    <div
      className="flex-1 overflow-y-auto px-5 pb-4"
      style={{
        // Hide scrollbar cross-browser
        scrollbarWidth: "none",        /* Firefox */
        msOverflowStyle: "none",       /* IE/Edge */
      }}
    >
      {/* WebKit scrollbar hidden via inline style trick */}
      <style>{`.activity-scroll::-webkit-scrollbar { display: none; }`}</style>

      <div className="activity-scroll">
        {groups.map((group, gi) => (
          <div key={group}>
            {/* Group label */}
            <p
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{
                color: "#4B5563",
                marginTop: gi === 0 ? 0 : 12,
                marginBottom: 4,
              }}
            >
              {group}
            </p>

            {/* Items */}
            {ACTIVITY.filter((a) => a.group === group).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex items-center gap-3 rounded-xl px-2 -mx-2 transition-colors duration-150 cursor-default"
                style={{ paddingTop: 7, paddingBottom: 7 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: item.bg }}
                >
                  <item.icon size={13} style={{ color: item.color }} />
                </div>

                {/* Text */}
                <p
                  className="flex-1 min-w-0 text-xs leading-snug truncate"
                  style={{ color: "#D1D5DB" }}
                >
                  {item.text}
                </p>

                {/* Time */}
                <span
                  className="text-[10px] shrink-0 tabular-nums"
                  style={{ color: "#4B5563" }}
                >
                  {item.time}
                </span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ActivityFeed;
