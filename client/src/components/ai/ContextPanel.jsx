import { motion } from "framer-motion";
import { FolderKanban, CheckSquare, DollarSign, ArrowRight, Zap, TrendingUp } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useDashboardStore from "../../store/dashboardStore";
import useAiStore from "../../store/aiStore";
import { formatCurrency } from "../../utils/helpers";

const StatPill = ({ icon: Icon, value, label, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    className="flex items-center gap-2 px-3 py-2 rounded-xl"
    style={{
      background: `linear-gradient(135deg, ${color}14, ${color}06)`,
      border: `1px solid ${color}28`,
      boxShadow: `0 0 16px ${color}10`,
    }}
  >
    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
      <Icon size={11} style={{ color }} strokeWidth={2} />
    </div>
    <div>
      <p className="text-xs font-bold leading-none" style={{ color }}>{value}</p>
      <p className="text-[9px] mt-0.5 leading-none" style={{ color: "#4B5563" }}>{label}</p>
    </div>
  </motion.div>
);

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(99,91,255,0.12) 0%, rgba(139,92,246,0.06) 50%, rgba(0,212,255,0.04) 100%)",
        border: "1px solid rgba(99,91,255,0.22)",
        boxShadow: "0 0 0 1px rgba(99,91,255,0.08), 0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.7), rgba(0,212,255,0.5), transparent)" }} />

      {/* Ambient corner glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.1) 0%, transparent 65%)" }} />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 65%)" }} />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
              You have{" "}
              <span style={{ color: "#A78BFA", fontWeight: 600 }}>{activeProjects} active project{activeProjects !== 1 ? "s" : ""}</span>
              {" "}and{" "}
              <span style={{ color: "#34D399", fontWeight: 600 }}>{pendingTasks} task{pendingTasks !== 1 ? "s" : ""} in progress</span>.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <TrendingUp size={10} style={{ color: "#22C55E" }} />
            <span className="text-[10px] font-semibold" style={{ color: "#22C55E" }}>Active</span>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatPill icon={FolderKanban} value={activeProjects} label="Projects"    color="#635BFF" delay={0.15} />
          <StatPill icon={CheckSquare}  value={pendingTasks}   label="In Progress" color="#22C55E" delay={0.2}  />
          <StatPill icon={DollarSign}   value={formatCurrency(revenue, undefined, true)} label="Revenue" color="#00D4FF" delay={0.25} />
        </div>

        {/* Divider */}
        <div className="h-px mb-4" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* CTA */}
        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => sendMessage(contextPrompt)}
          className="group flex items-center gap-2 text-xs font-semibold transition-all duration-150"
          style={{ color: "#A78BFA" }}
          onMouseEnter={e => e.currentTarget.style.color = "#C4B5FD"}
          onMouseLeave={e => e.currentTarget.style.color = "#A78BFA"}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,91,255,0.18)", border: "1px solid rgba(99,91,255,0.3)" }}>
            <Zap size={11} style={{ color: "#A78BFA" }} />
          </div>
          Prioritize my day
          <ArrowRight size={12} className="transition-transform duration-150 group-hover:translate-x-1" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ContextPanel;
