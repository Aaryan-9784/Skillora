import { motion } from "framer-motion";
import { FolderKanban, CheckSquare, DollarSign, Sparkles, ArrowRight, Zap } from "lucide-react";
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
      transition={{ delay: 0.1, duration: 0.3 }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,91,255,0.1) 0%, rgba(0,212,255,0.05) 100%)",
        border: "1px solid rgba(99,91,255,0.22)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Top shimmer */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.6), rgba(0,212,255,0.4), transparent)" }} />

      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.12) 0%, transparent 70%)" }} />

      <div className="relative flex items-start gap-3.5">
        {/* AI orb */}
        <div className="relative shrink-0">
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-xl"
            style={{ background: "linear-gradient(135deg, #635BFF, #00D4FF)", filter: "blur(6px)" }}
          />
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #635BFF, #8579FF)", boxShadow: "0 0 16px rgba(99,91,255,0.5)" }}>
            <Sparkles size={16} className="text-white" strokeWidth={1.8} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: "#F9FAFB" }}>
            Hi {user?.name?.split(" ")[0]}! Here&apos;s your workspace snapshot.
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#9CA3AF" }}>
            You have{" "}
            <span style={{ color: "#A78BFA", fontWeight: 600 }}>{activeProjects} active project{activeProjects !== 1 ? "s" : ""}</span>
            {" "}and{" "}
            <span style={{ color: "#22C55E", fontWeight: 600 }}>{pendingTasks} task{pendingTasks !== 1 ? "s" : ""} in progress</span>.
            {revenue > 0 && (
              <> Total revenue: <span style={{ color: "#00D4FF", fontWeight: 600 }}>{formatCurrency(revenue)}</span>.</>
            )}
          </p>

          {/* Context stat pills */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {[
              { icon: FolderKanban, value: activeProjects, label: "Projects",    color: "#635BFF" },
              { icon: CheckSquare,  value: pendingTasks,   label: "In Progress", color: "#22C55E" },
              { icon: DollarSign,   value: formatCurrency(revenue, undefined, true), label: "Revenue", color: "#00D4FF" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: `${color}10`, border: `1px solid ${color}22` }}>
                <Icon size={11} style={{ color }} />
                <span className="text-xs font-semibold" style={{ color }}>{value}</span>
                <span className="text-[10px]" style={{ color: "#4B5563" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendMessage(contextPrompt)}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150"
            style={{ color: "#A78BFA" }}
            onMouseEnter={e => e.currentTarget.style.color = "#C4B5FD"}
            onMouseLeave={e => e.currentTarget.style.color = "#A78BFA"}>
            <Zap size={11} />
            Help me prioritize today
            <ArrowRight size={11} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContextPanel;
