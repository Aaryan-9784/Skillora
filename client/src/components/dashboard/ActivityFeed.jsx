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
  <div className="relative rounded-2xl p-5 overflow-hidden h-full"
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(12px)",
    }}>
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>Recent Activity</h3>
      <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }}>
        <motion.div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }}
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }} />
      </div>
    </div>

    {/* Feed */}
    <div className="space-y-0 overflow-y-auto" style={{ maxHeight: 320 }}>
      {groups.map((group) => (
        <div key={group}>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-2 mt-3 first:mt-0"
            style={{ color: "#4B5563" }}>{group}</p>
          {ACTIVITY.filter((a) => a.group === group).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-start gap-3 py-2.5 rounded-xl px-2 -mx-2 transition-all duration-150 group cursor-default"
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {/* Icon */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: item.bg }}>
                <item.icon size={13} style={{ color: item.color }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug" style={{ color: "#D1D5DB" }}>{item.text}</p>
              </div>

              {/* Time */}
              <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "#4B5563" }}>{item.time}</span>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default ActivityFeed;
