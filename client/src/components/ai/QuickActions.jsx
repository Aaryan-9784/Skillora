import { motion } from "framer-motion";
import { FolderKanban, FileText, DollarSign, BarChart2, Lightbulb, CheckSquare } from "lucide-react";

const ACTIONS = [
  {
    icon:    FolderKanban,
    label:   "Project plan",
    prompt:  "Generate a detailed project plan for my most recent active project",
    color:   "text-brand bg-brand-50 dark:bg-brand/10",
  },
  {
    icon:    CheckSquare,
    label:   "Break into tasks",
    prompt:  "Break down my current project into specific actionable tasks with priorities",
    color:   "text-success bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon:    FileText,
    label:   "Write proposal",
    prompt:  "Write a professional client proposal template I can customize",
    color:   "text-info bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon:    DollarSign,
    label:   "Pricing advice",
    prompt:  "Based on my skills and projects, what should I charge for my services?",
    color:   "text-warning bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon:    BarChart2,
    label:   "Analyze productivity",
    prompt:  "Analyze my productivity and give me 5 specific improvements I can make",
    color:   "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  },
  {
    icon:    Lightbulb,
    label:   "Business insights",
    prompt:  "What are the biggest opportunities to grow my freelance business right now?",
    color:   "text-cyan bg-cyan-50 dark:bg-cyan-900/20",
  },
];

const QuickActions = ({ onSelect }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {ACTIONS.map((action, i) => (
      <motion.button
        key={action.label}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => onSelect(action.prompt)}
        className="flex items-start gap-2.5 p-3 rounded-xl border border-surface-border dark:border-dark-border
                   bg-white dark:bg-dark-card text-left
                   hover:border-brand/40 hover:shadow-sm transition-all duration-150 group"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
          <action.icon size={13} />
        </div>
        <span className="text-xs font-medium text-ink-secondary group-hover:text-ink dark:text-slate-400 dark:group-hover:text-slate-200 leading-snug">
          {action.label}
        </span>
      </motion.button>
    ))}
  </div>
);

export default QuickActions;
