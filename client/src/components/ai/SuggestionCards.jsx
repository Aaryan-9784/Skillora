import { motion } from "framer-motion";
import { FolderKanban, FileText, DollarSign, BarChart2, Lightbulb, CheckSquare, Zap, Users } from "lucide-react";

const SUGGESTIONS = [
  {
    icon:    FolderKanban,
    label:   "Generate project plan",
    desc:    "Break down a project into milestones",
    prompt:  "Generate a detailed project plan for my most recent active project with milestones and timeline",
    from:    "#635BFF", to: "#8579FF",
    slash:   "/plan",
  },
  {
    icon:    CheckSquare,
    label:   "Create task list",
    desc:    "Auto-generate tasks from project",
    prompt:  "Break down my current project into specific actionable tasks with priorities and estimated hours",
    from:    "#22C55E", to: "#16A34A",
    slash:   "/tasks",
  },
  {
    icon:    FileText,
    label:   "Write proposal",
    desc:    "Professional client proposal",
    prompt:  "Write a professional client proposal template I can customize for my next project",
    from:    "#00D4FF", to: "#0EA5E9",
    slash:   "/proposal",
  },
  {
    icon:    DollarSign,
    label:   "Suggest pricing",
    desc:    "Market-rate pricing advice",
    prompt:  "Based on my skills and current projects, what should I charge for my freelance services?",
    from:    "#F59E0B", to: "#D97706",
    slash:   "/pricing",
  },
  {
    icon:    BarChart2,
    label:   "Analyze productivity",
    desc:    "Insights from your work data",
    prompt:  "Analyze my productivity based on my projects and tasks, give me 5 specific improvements",
    from:    "#8B5CF6", to: "#7C3AED",
    slash:   "/analyze",
  },
  {
    icon:    Lightbulb,
    label:   "Business insights",
    desc:    "Growth opportunities",
    prompt:  "What are the biggest opportunities to grow my freelance business right now based on my data?",
    from:    "#EC4899", to: "#DB2777",
    slash:   "/insights",
  },
];

const SuggestionCards = ({ onSelect }) => (
  <div className="space-y-3">
    <p className="text-xs font-semibold tracking-widest uppercase text-center"
      style={{ color: "#4B5563" }}>Quick Actions</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          onClick={() => onSelect(s.prompt)}
          className="relative flex flex-col items-start gap-2 p-3.5 rounded-2xl text-left overflow-hidden group"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.border = `1px solid ${s.from}40`;
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px ${s.from}20`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Ambient glow */}
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${s.from}30 0%, transparent 70%)` }} />

          {/* Icon */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${s.from}25, ${s.to}15)`, border: `1px solid ${s.from}30` }}>
            <s.icon size={15} style={{ color: s.from }} strokeWidth={1.8} />
          </div>

          {/* Text */}
          <div>
            <p className="text-xs font-semibold leading-snug" style={{ color: "#E5E7EB" }}>{s.label}</p>
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#6B7280" }}>{s.desc}</p>
          </div>

          {/* Slash command */}
          <div className="mt-auto">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.05)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.06)" }}>
              {s.slash}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

export default SuggestionCards;
