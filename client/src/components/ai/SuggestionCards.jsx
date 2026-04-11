import { motion } from "framer-motion";
import { FolderKanban, FileText, DollarSign, BarChart2, Lightbulb, CheckSquare } from "lucide-react";

const SUGGESTIONS = [
  {
    icon:   FolderKanban,
    label:  "Generate project plan",
    desc:   "Break down a project into milestones",
    prompt: "Generate a detailed project plan for my most recent active project with milestones and timeline",
    from:   "#635BFF", to: "#8579FF", slash: "/plan",
  },
  {
    icon:   CheckSquare,
    label:  "Create task list",
    desc:   "Auto-generate tasks from project",
    prompt: "Break down my current project into specific actionable tasks with priorities and estimated hours",
    from:   "#22C55E", to: "#16A34A", slash: "/tasks",
  },
  {
    icon:   FileText,
    label:  "Write proposal",
    desc:   "Professional client proposal",
    prompt: "Write a professional client proposal template I can customize for my next project",
    from:   "#00D4FF", to: "#0EA5E9", slash: "/proposal",
  },
  {
    icon:   DollarSign,
    label:  "Suggest pricing",
    desc:   "Market-rate pricing advice",
    prompt: "Based on my skills and current projects, what should I charge for my freelance services?",
    from:   "#F59E0B", to: "#D97706", slash: "/pricing",
  },
  {
    icon:   BarChart2,
    label:  "Analyze productivity",
    desc:   "Insights from your work data",
    prompt: "Analyze my productivity based on my projects and tasks, give me 5 specific improvements",
    from:   "#8B5CF6", to: "#7C3AED", slash: "/analyze",
  },
  {
    icon:   Lightbulb,
    label:  "Business insights",
    desc:   "Growth opportunities",
    prompt: "What are the biggest opportunities to grow my freelance business right now based on my data?",
    from:   "#EC4899", to: "#DB2777", slash: "/insights",
  },
];

const SuggestionCards = ({ onSelect }) => (
  <div className="space-y-3">
    {/* Section label */}
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      <p className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: "#374151" }}>
        Quick Actions
      </p>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>

    {/* Cards grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(s.prompt)}
          className="relative flex flex-col items-start gap-3 p-4 rounded-2xl text-left overflow-hidden group"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${s.from}10 0%, ${s.to}06 100%)`;
            e.currentTarget.style.border = `1px solid ${s.from}40`;
            e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.25), 0 0 0 1px ${s.from}18`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Ambient corner glow */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `radial-gradient(circle, ${s.from}35 0%, transparent 70%)` }} />

          {/* Top gradient line */}
          <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `linear-gradient(90deg, transparent, ${s.from}80, transparent)` }} />

          {/* Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${s.from}22, ${s.to}12)`,
              border: `1px solid ${s.from}35`,
              boxShadow: `0 0 12px ${s.from}20`,
            }}>
            <s.icon size={16} style={{ color: s.from }} strokeWidth={1.8} />
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-xs font-semibold leading-snug" style={{ color: "#E5E7EB" }}>{s.label}</p>
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#6B7280" }}>{s.desc}</p>
          </div>

          {/* Slash badge */}
          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md"
            style={{
              background: `${s.from}12`,
              color: s.from,
              border: `1px solid ${s.from}25`,
            }}>
            {s.slash}
          </span>
        </motion.button>
      ))}
    </div>
  </div>
);

export default SuggestionCards;
