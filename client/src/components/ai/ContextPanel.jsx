import { motion } from "framer-motion";
import { FolderKanban, CheckSquare, DollarSign, Sparkles, ArrowRight } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useDashboardStore from "../../store/dashboardStore";
import useAiStore from "../../store/aiStore";
import { formatCurrency } from "../../utils/helpers";

const ContextPanel = () => {
  const { user }    = useAuthStore();
  const { summary } = useDashboardStore();
  const { sendMessage } = useAiStore();

  const s = summary?.data || summary;
  const activeProjects = s?.projects?.active ?? 0;
  const pendingTasks   = s?.tasks?.in_progress ?? 0;
  const revenue        = s?.revenue?.totalRevenue ?? 0;

  const contextPrompt = `I have ${activeProjects} active projects and ${pendingTasks} tasks in progress. My total revenue is ${formatCurrency(revenue)}. Can you help me prioritize my work and suggest what I should focus on today?`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,91,255,0.08) 0%, rgba(0,212,255,0.04) 100%)",
        border: "1px solid rgba(99,91,255,0.2)",
      }}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.5), rgba(0,212,255,0.3), transparent)" }} />

      {/* Ambient */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.1) 0%, transparent 70%)" }} />

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(99,91,255,0.2)" }}>
          <Sparkles size={14} style={{ color: "#A78BFA" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: "#E5E7EB" }}>
            Good to see you, {user?.name?.split(" ")[0]}!
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
            You have{" "}
            <span style={{ color: "#A78BFA", fontWeight: 600 }}>{activeProjects} active projects</span>
            {" "}and{" "}
            <span style={{ color: "#22C55E", fontWeight: 600 }}>{pendingTasks} tasks in progress</span>.
            {revenue > 0 && (
              <> Total revenue: <span style={{ color: "#00D4FF", fontWeight: 600 }}>{formatCurrency(revenue)}</span>.</>
            )}
            {" "}Want help prioritizing?
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-3">
            {[
              { icon: FolderKanban, value: activeProjects, label: "Projects", color: "#635BFF" },
              { icon: CheckSquare,  value: pendingTasks,   label: "In Progress", color: "#22C55E" },
              { icon: DollarSign,   value: formatCurrency(revenue, undefined, true), label: "Revenue", color: "#00D4FF" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <Icon size={11} style={{ color }} />
                <span className="text-xs font-semibold" style={{ color }}>{value}</span>
                <span className="text-[10px]" style={{ color: "#6B7280" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendMessage(contextPrompt)}
            className="flex items-center gap-1.5 mt-3 text-xs font-medium transition-colors duration-150"
            style={{ color: "#A78BFA" }}
            onMouseEnter={e => e.currentTarget.style.color = "#C4B5FD"}
            onMouseLeave={e => e.currentTarget.style.color = "#A78BFA"}>
            Help me prioritize today <ArrowRight size={11} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContextPanel;
