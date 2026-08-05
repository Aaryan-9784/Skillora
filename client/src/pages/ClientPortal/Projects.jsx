import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Search, Filter, Calendar,
  AlertCircle, X, TrendingUp, CheckSquare,
  Clock, ChevronRight, ListTodo, Circle,
  CheckCircle2, Loader2, RefreshCw, FolderKanban,
  LayoutGrid, ArrowUpRight, BarChart2,
} from "lucide-react";
import useClientPortalStore from "../../store/clientPortalStore";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { formatDate } from "../../utils/helpers";

const STATUS_CONFIG = {
  planning:  { color: "#9CA3AF", bg: "rgba(107,114,128,0.15)", label: "Planning" },
  active:    { color: "#22C55E", bg: "rgba(34,197,94,0.15)",   label: "Active" },
  on_hold:   { color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  label: "On Hold" },
  completed: { color: "#60A5FA", bg: "rgba(59,130,246,0.15)",  label: "Completed" },
  cancelled: { color: "#EF4444", bg: "rgba(239,68,68,0.15)",   label: "Cancelled" },
};

const TASK_STATUS = {
  todo:        { icon: Circle,       color: "#9CA3AF", label: "To Do" },
  in_progress: { icon: Loader2,      color: "#F59E0B", label: "In Progress" },
  review:      { icon: Clock,        color: "#A78BFA", label: "Review" },
  done:        { icon: CheckCircle2, color: "#22C55E", label: "Done" },
};

const PRIORITY_COLOR = { low: "#9CA3AF", medium: "#F59E0B", high: "#EF4444", urgent: "#DC2626" };

const StatusBadge = ({ status }) => {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.planning;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  );
};

// ── Glass Container Card (Matches Admin Theme) ─────────────────────────────
const GCard = ({ children, delay, className, glow }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16,1,0.3,1] }}
    className={"relative overflow-hidden rounded-2xl " + (className || "")}
    style={{
      background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: glow ? ("0 0 50px " + glow + "10") : "0 0 30px rgba(99,91,255,0.04)",
    }}
  >
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{ background: glow
        ? ("linear-gradient(90deg,transparent," + glow + "50,transparent)")
        : "linear-gradient(90deg,transparent,rgba(99,91,255,0.25),transparent)" }} />
    {children}
  </motion.div>
);

// ── Top KPI Card Component (Matches Admin Overview theme) ──────────────────
const KPICard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16,1,0.3,1] }}
    whileHover={{ y: -4, transition: { duration: 0.18 } }}
    className="relative overflow-hidden rounded-2xl p-5 cursor-default group"
    style={{
      background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)",
      border: "1px solid " + color + "20", backdropFilter: "blur(16px)",
    }}
  >
    <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none transition-all duration-500 group-hover:scale-150 opacity-60"
      style={{ background: "radial-gradient(circle," + color + "20 0%,transparent 70%)" }} />
    <div className="absolute inset-x-0 top-0 h-px"
      style={{ background: "linear-gradient(90deg,transparent," + color + "50,transparent)" }} />

    <div className="flex items-center justify-between mb-3">
      <span className="text-[12px] font-semibold" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</span>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "16", border: "1px solid " + color + "30", boxShadow: "0 0 16px " + color + "18" }}>
        <Icon size={17} style={{ color }} />
      </div>
    </div>

    <p className="text-[24px] xl:text-[28px] font-black text-white tracking-tight leading-none mb-1.5">{value}</p>
    {sub && <p className="text-[11px] font-medium truncate" style={{ color: "rgba(148,163,184,0.55)" }}>{sub}</p>}
  </motion.div>
);

// ── Task List Inside Drawer ────────────────────────────────────────────────
const TaskList = ({ projectId }) => {
  const { tasksByProject, loading, fetchTasks } = useClientPortalStore();
  const tasks = tasksByProject[projectId] || [];
  const isLoading = loading.tasks?.[projectId];

  useEffect(() => { fetchTasks(projectId); }, [projectId]);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 gap-2 mt-3">
        <ListTodo size={24} style={{ color: "rgba(148,163,184,0.3)" }} />
        <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>No active tasks listed for this project</p>
      </div>
    );
  }

  const grouped = {
    todo:        tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    review:      tasks.filter((t) => t.status === "review"),
    done:        tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="mt-3 space-y-4">
      {Object.entries(grouped).map(([status, list]) => {
        if (list.length === 0) return null;
        const cfg = TASK_STATUS[status];
        const Icon = cfg.icon;
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={12} style={{ color: cfg.color }} />
              <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${cfg.color}18`, color: cfg.color }}>{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((task) => (
                <div key={task._id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: PRIORITY_COLOR[task.priority] || "#9CA3AF" }} />
                  <p className="flex-1 text-xs font-semibold text-white truncate">{task.title}</p>
                  {task.dueDate && (
                    <span className="text-[10px] font-medium shrink-0" style={{ color: "rgba(148,163,184,0.5)" }}>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Project Detail Drawer ──────────────────────────────────────────────────
const ProjectDrawer = ({ project, onClose }) => {
  const [tab, setTab] = useState("overview");
  const pct = project?.progress ?? 0;
  const cfg = STATUS_CONFIG[project?.status] || STATUS_CONFIG.planning;

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
            style={{
              background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-24px 0 64px rgba(0,0,0,0.7)",
            }}>
            <div className="absolute top-0 left-0 bottom-0 w-px"
              style={{ background: "linear-gradient(180deg,transparent,rgba(99,91,255,0.5),rgba(0,212,255,0.3),transparent)" }} />

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{ background: "rgba(8,14,26,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                  <FolderOpen size={16} style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-sm font-black text-white leading-tight">{project.title}</p>
                  <StatusBadge status={project.status} />
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl transition-colors cursor-pointer"
                style={{ color: "rgba(148,163,184,0.6)" }}
                onMouseEnter={e => e.currentTarget.style.color = "#F9FAFB"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(148,163,184,0.6)"}>
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 px-6 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["overview", "tasks"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 cursor-pointer"
                  style={{
                    background: tab === t ? "linear-gradient(135deg,rgba(99,91,255,0.25) 0%,rgba(139,92,246,0.15) 100%)" : "transparent",
                    color: tab === t ? "#EDE9FE" : "rgba(148,163,184,0.6)",
                    border: tab === t ? "1px solid rgba(99,91,255,0.4)" : "1px solid transparent",
                  }}>{t}</button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              {tab === "overview" ? (
                <>
                  {/* Progress Bar Container */}
                  <div className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold" style={{ color: "rgba(148,163,184,0.7)" }}>Project Progress</span>
                      <span className="text-sm font-black" style={{ color: cfg.color }}>{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg,${cfg.color},${cfg.color}80)` }} />
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(148,163,184,0.5)" }}>Description</p>
                      <p className="text-xs leading-relaxed font-medium" style={{ color: "#D1D5DB" }}>{project.description}</p>
                    </div>
                  )}

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Deadline",   value: project.deadline ? formatDate(project.deadline) : "—", icon: Calendar },
                      { label: "Budget",     value: project.budget > 0 ? `₹${project.budget?.toLocaleString()}` : "—", icon: TrendingUp },
                      { label: "Freelancer", value: project.owner?.name || "—", icon: CheckSquare },
                      { label: "Tasks",      value: project.taskStats ? `${project.taskStats.done || 0}/${project.taskStats.total || 0} done` : "—", icon: ListTodo },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-xl p-3.5"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon size={12} style={{ color: "rgba(148,163,184,0.5)" }} />
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.5)" }}>{label}</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <TaskList projectId={project._id} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Project Card ───────────────────────────────────────────────────────────
const ProjectCard = ({ project, delay, onSelect }) => {
  const pct = project.progress ?? 0;
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  return (
    <GCard delay={delay} glow={cfg.color} className="p-5 cursor-pointer group">
      <div onClick={() => onSelect(project)}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, boxShadow: `0 0 16px ${cfg.color}15` }}>
            <FolderOpen size={18} style={{ color: cfg.color }} />
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            <ChevronRight size={14} style={{ color: "rgba(148,163,184,0.5)" }}
              className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <h3 className="text-sm font-bold text-white mb-1.5 leading-snug group-hover:text-indigo-400 transition-colors">{project.title}</h3>
        {project.description && (
          <p className="text-xs font-medium mb-4 line-clamp-2" style={{ color: "rgba(148,163,184,0.6)" }}>{project.description}</p>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold" style={{ color: "rgba(148,163,184,0.6)" }}>Progress</span>
            <span className="text-xs font-black" style={{ color: cfg.color }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, delay: delay + 0.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg,${cfg.color},${cfg.color}99)` }} />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {project.deadline && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} style={{ color: "rgba(148,163,184,0.5)" }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.65)" }}>Due {formatDate(project.deadline)}</span>
            </div>
          )}
          {project.budget > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} style={{ color: "rgba(148,163,184,0.5)" }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.65)" }}>₹{project.budget?.toLocaleString()}</span>
            </div>
          )}
          {project.taskStats && (
            <div className="flex items-center gap-1.5 ml-auto">
              <CheckSquare size={11} style={{ color: "rgba(148,163,184,0.5)" }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.65)" }}>
                {project.taskStats.done || 0}/{project.taskStats.total || 0} tasks
              </span>
            </div>
          )}
        </div>
      </div>
    </GCard>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const ClientProjects = () => {
  const { projects, loading, error, fetchProjects, patchProject } = useClientPortalStore();
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    fetchProjects();
    const onProject = (e) => patchProject(e.detail.projectId, { status: e.detail.status, progress: e.detail.progress });
    window.addEventListener("project:updated", onProject);
    return () => window.removeEventListener("project:updated", onProject);
  }, []);

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  }, [projects, search, statusFilter]);

  const counts = useMemo(() => ({
    active:    projects.filter((p) => p.status === "active").length,
    planning:  projects.filter((p) => p.status === "planning").length,
    completed: projects.filter((p) => p.status === "completed").length,
    on_hold:   projects.filter((p) => p.status === "on_hold").length,
  }), [projects]);

  const STATUS_OPTS = ["all","planning","active","on_hold","completed","cancelled"];

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{ background: "linear-gradient(135deg,#FFFFFF 30%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Projects
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Monitor active workstreams, milestone progress, and task deliverables
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchProjects}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.75)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.75)"; }}
            >
              <RefreshCw size={15} className={loading.projects ? "animate-spin text-indigo-400" : ""} />
            </motion.button>
          </div>
        </motion.div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={FolderOpen}   label="Active Workstreams" value={counts.active}    color="#22C55E" delay={0}    sub="Currently in development" />
        <KPICard icon={Clock}        label="Planning Phase"     value={counts.planning}  color="#9CA3AF" delay={0.05} sub="Scope & milestone setup" />
        <KPICard icon={CheckCircle2} label="Completed Projects" value={counts.completed} color="#60A5FA" delay={0.1}  sub="Delivered & signed off" />
        <KPICard icon={FolderKanban} label="Total Projects"     value={projects.length}  color="#F59E0B" delay={0.15} sub="All client engagements" />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects by title or description..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F9FAFB",
            }}
            onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"; e.currentTarget.style.background = "rgba(99,91,255,0.06)"; }}
            onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} style={{ color: "rgba(148,163,184,0.5)", marginRight: 2 }} />
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 cursor-pointer"
              style={{
                background: statusFilter === s ? "linear-gradient(135deg,rgba(99,91,255,0.25) 0%,rgba(139,92,246,0.15) 100%)" : "rgba(255,255,255,0.04)",
                color: statusFilter === s ? "#EDE9FE" : "rgba(148,163,184,0.7)",
                border: statusFilter === s ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: statusFilter === s ? "0 0 12px rgba(99,91,255,0.18)" : "none",
              }}>{s.replace("_"," ")}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading.projects && projects.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error.projects && projects.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertCircle size={24} style={{ color: "#EF4444" }} />
          </div>
          <p className="text-xs font-bold text-white">Failed to load projects</p>
          <button onClick={fetchProjects} className="text-xs font-bold px-4 py-2 rounded-xl"
            style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <GCard delay={0.1} className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <FolderOpen size={26} style={{ color: "rgba(148,163,184,0.4)" }} />
          </div>
          <p className="text-sm font-bold text-white">
            {projects.length > 0 ? "No projects match your active filters" : "No projects assigned yet"}
          </p>
          <p className="text-xs font-medium max-w-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
            {projects.length > 0 ? "Try adjusting your search criteria or status filter." : "Once a freelancer initiates a project in your workspace, it will appear here."}
          </p>
          {(search || statusFilter !== "all") && (
            <button onClick={() => { setSearch(""); setStatus("all"); }}
              className="text-xs font-bold px-4 py-2 rounded-xl mt-1 cursor-pointer"
              style={{ background: "rgba(99,91,255,0.18)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
              Clear Filters
            </button>
          )}
        </GCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ProjectCard key={p._id} project={p} delay={i * 0.04} onSelect={setSelected} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Project Detail Drawer */}
      <ProjectDrawer project={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
};

export default ClientProjects;
