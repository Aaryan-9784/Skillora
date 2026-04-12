/**
 * WidgetQuickActions — Compact 2×3 grid of quick-action cards for the floating widget.
 *
 * Each card:
 * - Glass card with color-coded icon
 * - Hover: lift + glow border + scale(1.03)
 * - Click: auto-fills the prompt via aiStore.sendMessage
 */

import { motion } from "framer-motion";
import {
  FolderKanban,
  CheckSquare,
  FileText,
  DollarSign,
  BarChart2,
  Lightbulb,
} from "lucide-react";
import useAiStore from "../../store/aiStore";

const ACTIONS = [
  {
    icon:   FolderKanban,
    label:  "Project plan",
    prompt: "Generate a detailed project plan for my most recent active project",
    color:  "#635BFF",
    bg:     "rgba(99,91,255,0.12)",
    border: "rgba(99,91,255,0.25)",
  },
  {
    icon:   CheckSquare,
    label:  "Break into tasks",
    prompt: "Break down my current project into specific actionable tasks with priorities",
    color:  "#22C55E",
    bg:     "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.25)",
  },
  {
    icon:   FileText,
    label:  "Write proposal",
    prompt: "Write a professional client proposal template I can customize",
    color:  "#00D4FF",
    bg:     "rgba(0,212,255,0.12)",
    border: "rgba(0,212,255,0.25)",
  },
  {
    icon:   DollarSign,
    label:  "Pricing advice",
    prompt: "Based on my skills and projects, what should I charge for my services?",
    color:  "#F59E0B",
    bg:     "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
  },
  {
    icon:   BarChart2,
    label:  "Analyze productivity",
    prompt: "Analyze my productivity and give me 5 specific improvements I can make",
    color:  "#8B5CF6",
    bg:     "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.25)",
  },
  {
    icon:   Lightbulb,
    label:  "Business insights",
    prompt: "What are the biggest opportunities to grow my freelance business right now?",
    color:  "#EC4899",
    bg:     "rgba(236,72,153,0.12)",
    border: "rgba(236,72,153,0.25)",
  },
];

const WidgetQuickActions = () => {
  const { sendMessage } = useAiStore();

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
        <p
          className="text-[9px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "#374151" }}
        >
          Quick actions
        </p>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* 2×3 grid */}
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -2, scale: 1.03, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.96 }}
            onClick={() => sendMessage(action.prompt)}
            className="relative flex flex-col items-start gap-2 p-3 rounded-2xl text-left overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = action.bg;
              e.currentTarget.style.border = `1px solid ${action.border}`;
              e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.25), 0 0 0 1px ${action.bg}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: action.bg, border: `1px solid ${action.border}` }}
            >
              <action.icon size={13} style={{ color: action.color }} strokeWidth={1.8} />
            </div>

            {/* Label */}
            <p
              className="text-[10px] font-semibold leading-snug"
              style={{ color: "#D1D5DB" }}
            >
              {action.label}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default WidgetQuickActions;
