import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign, FolderKanban, CheckSquare, Clock,
  Plus, UserPlus, ArrowRight, AlertCircle, Sparkles, Zap, ExternalLink,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useDashboardStore from "../../store/dashboardStore";
import KPIWidget from "../../components/dashboard/KPIWidget";
import EarningsChart from "../../components/dashboard/EarningsChart";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import { formatDate, formatCurrency } from "../../utils/helpers";

const GlassSkeleton = ({ className = "" }) => (
  <div className={`rounded-2xl animate-pulse ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
);

const AIInsight = ({ text }) => (
  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
    className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
    style={{ background: "linear-gradient(135deg, rgba(99,91,255,0.12) 0%, rgba(0,212,255,0.06) 100%)", border: "1px solid rgba(99,91,255,0.2)" }}>
    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(99,91,255,0.2)" }}>
      <Sparkles size={12} style={{ color: "#A78BFA" }} />
    </div>
    <p className="text-xs flex-1" style={{ color: "#C4B5FD" }}>{text}</p>
    <Zap size={11} style={{ color: "#635BFF" }} />
  </motion.div>
);

const STATUS_COLORS = {
  active:    { dot: "#22C55E", bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  planning:  { dot: "#9CA3AF", bg: "rgba(156,163,175,0.12)", text: "#9CA3AF" },
  on_hold:   { dot: "#F59E0B", bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  completed: { dot: "#00D4FF", bg: "rgba(0,212,255,0.12)",   text: "#00D4FF" },
  cancelled: { dot: "#EF4444", bg: "rgba(239,68,68,0.12)",   text: "#EF4444" },
};

const ProjectRow = ({ project, index }) => {
  const sc = STATUS_COLORS[project.status] || STATUS_COLORS.planning;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 py-3 px-3 -mx-3 rounded-xl transition-all duration-150 group cursor-pointer"
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
        <FolderKanban size={14} style={{ color: "#635BFF" }} />
      </div>
      <div className="flex-1 min-w-0">
        <Link to={`/projects/${project._id}`} className="text-sm font-medium truncate block"
          style={{ color: "#E5E7EB" }}>{project.title}</Link>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1 rounded-full overflow-hidden max-w-[100px]"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress || 0}%` }}
              transition={{ duration: 0.8, delay: index * 0.05 + 0.3, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #635BFF, #00D4FF)" }} />
          </div>
          <span className="text-[10px]" style={{ color: "#6B7280" }}>{project.progress || 0}%</span>
        </div>
      </div>
      <span className="text-xs hidden sm:block shrink-0" style={{ color: "#6B7280" }}>
        {formatCurrency(project.budget, project.currency)}
      </span>
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full shrink-0"
        style={{ background: sc.bg, border: `1px solid ${sc.dot}30` }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
        <span className="text-[10px] font-medium capitalize" style={{ color: sc.text }}>
          {project.status?.replace("_", " ")}
        </span>
      </div>
      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: "#635BFF" }} />
    </motion.div>
  );
};

const EmptyProjects = () => {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-10 text-center">
      <div className="relative mb-5">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(99,91,255,0.15) 0%, rgba(0,212,255,0.08) 100%)", border: "1px solid rgba(99,91,255,0.2)", boxShadow: "0 0 32px rgba(99,91,255,0.15)" }}>
          <FolderKanban size={28} style={{ color: "#635BFF" }} strokeWidth={1.5} />
        </motion.div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0" style={{ transformOrigin: "center" }}>
          <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full -translate-x-1/2"
            style={{ background: "#635BFF", boxShadow: "0 0 8px rgba(99,91,255,0.8)" }} />
        </motion.div>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "#E5E7EB" }}>No projects yet</p>
      <p className="text-xs mb-5 max-w-[200px]" style={{ color: "#6B7280" }}>
        Create your first project and start tracking your work
      </p>
      <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(99,91,255,0.4)" }} whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/projects")}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)", boxShadow: "0 0 16px rgba(99,91,255,0.3)" }}>
        <Plus size={14} strokeWidth={2.5} /> Create your first project
      </motion.button>
      <p className="text-[10px] mt-3 flex items-center gap-1" style={{ color: "#4B5563" }}>
        <Sparkles size={9} style={{ color: "#635BFF" }} /> AI can generate a project plan for you
      </p>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user }                             = useAuthStore();
  const { summary, fetchSummary, isLoading } = useDashboardStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
    const handleSync = () => fetchSummary();
    window.addEventListener("dashboard:refresh", handleSync);
    window.addEventListener("invoice:updated",   handleSync);
    window.addEventListener("project:updated",   handleSync);
    return () => {
      window.removeEventListener("dashboard:refresh", handleSync);
      window.removeEventListener("invoice:updated",   handleSync);
      window.removeEventListener("project:updated",   handleSync);
    };
  }, []);

  const s    = summary?.data || summary;
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const INSIGHTS = [
    "Your revenue increased by 18% this month — great momentum! 🚀",
    "You have tasks overdue. Consider rescheduling or delegating.",
    "Follow up with clients — some invoices may be overdue.",
  ];
  const insight = INSIGHTS[hour % INSIGHTS.length];

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{ background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {greeting}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Here&apos;s what&apos;s happening with your work today.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(99,91,255,0.5)" }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/clients", { state: { openAddModal: true } })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all"
            style={{ background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)", boxShadow: "0 0 20px rgba(99,91,255,0.35)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <UserPlus size={15} strokeWidth={2.5} /> Add Client
          </motion.button>
        </motion.div>

        {/* KPI Cards — Instant static render */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPIWidget label="Total Revenue"   value={formatCurrency(s?.revenue?.totalRevenue || 0)} icon={DollarSign}   trendLabel="vs last month" color="brand"   />
          <KPIWidget label="Active Projects"  value={s?.projects?.active ?? 0}                     icon={FolderKanban} trendLabel={`${s?.projects?.total ?? 0} total`} color="success" />
          <KPIWidget label="Tasks Done"       value={s?.tasks?.done ?? 0}                          icon={CheckSquare}  trendLabel={`${s?.tasks?.total ?? 0} total`} color="cyan"    />
          <KPIWidget label="In Progress"      value={s?.tasks?.in_progress ?? 0}                  icon={Clock}        trendLabel={`${s?.tasks?.todo ?? 0} todo`} color="warning" />
        </div>

        {/* Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
            <EarningsChart />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ActivityFeed />
          </motion.div>
        </div>

        {/* Upcoming tasks */}
        {s?.upcomingTasks?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl p-5"
            style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                <AlertCircle size={13} style={{ color: "#F59E0B" }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>Due this week</h3>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                {s.upcomingTasks.length} tasks
              </span>
            </div>
            <div className="space-y-2">
              {s.upcomingTasks.map((task) => (
                <div key={task._id} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-semibold" style={{ color: "#E5E7EB" }}>{task.title}</p>
                    <p className="text-xs" style={{ color: "#6B7280" }}>{task.projectId?.title}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize font-semibold"
                    style={{ background: task.priority === "urgent" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: task.priority === "urgent" ? "#EF4444" : "#F59E0B" }}>
                    {task.priority}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: "#6B7280" }}>{formatDate(task.dueDate)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Projects */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.25),transparent)" }} />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Projects</h3>
            <Link to="/projects" className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "#A78BFA" }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <GlassSkeleton key={i} className="h-12" />)}</div>
          ) : !s?.recentProjects?.length ? (
            <EmptyProjects />
          ) : (
            <div>{s.recentProjects.map((p, i) => <ProjectRow key={p._id} project={p} index={i} />)}</div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
