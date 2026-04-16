import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Search, Filter, Calendar,
  AlertCircle, X, TrendingUp, CheckSquare,
  Clock, ChevronRight, ListTodo, Circle,
  CheckCircle2, Loader2,
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
};

// ── Task list inside drawer ───────────────────────────────
const TaskList = ({ projectId }) => {
  const { tasksByProject, loading, fetchTasks } = useClientPortalStore();
  const tasks = tasksByProject[projectId] || [];
  const isLoading = loading.tasks?.[projectId];

  useEffect(() => { fetchTasks(projectId); }, [projectId]);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-10 rounded-xl" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 gap-2 mt-3">
        <ListTodo size={24} style={{ color: "#374151" }} />
        <p className="text-xs" style={{ color: "#6B7280" }}>No tasks yet</p>
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
              <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: `${cfg.color}18`, color: cfg.color }}>{list.length}</span>
            </div>
            <div className="space-y-1.5">
              {list.map((task) => (
                <div key={task._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: PRIORITY_COLOR[task.priority] || "#9CA3AF" }} />
                  <p className="flex-1 text-xs font-medium text-white truncate">{task.title}</p>
                  {task.dueDate && (
                    <span className="text-[10px] shrink-0" style={{ color: "#6B7280" }}>
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

// ── Project detail drawer ─────────────────────────────────
const ProjectDrawer = ({ project, onClose }) => {
  const [tab, setTab] = useState("overview");
  const pct = project?.progress ?? 0;
  const cfg = STATUS_CONFIG[project?.status] || STATUS_CONFIG.planning;

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
            style={{
              background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-24px 0 64px rgba(0,0,0,0.6)",
            }}>
            <div className="absolute top-0 left-0 bottom-0 w-px"
              style={{ background: "linear-gradient(180deg,transparent,rgba(99,91,255,0.5),rgba(0,212,255,0.3),transparent)" }} />

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{ background: "rgba(8,14,26,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}28` }}>
                  <FolderOpen size={16} style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{project.title}</p>
                  <StatusBadge status={project.status} />
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
                style={{ color: "#6B7280" }}
                onMouseEnter={e => e.currentTarget.style.color = "#F9FAFB"}
                onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}>
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["overview", "tasks"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{
                    background: tab === t ? "rgba(99,91,255,0.2)" : "transparent",
                    color: tab === t ? "#A78BFA" : "#6B7280",
                    border: tab === t ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                  }}>{t}</button>
              ))}
            </div>

            <div className="p-5 space-y-5">
              {tab === "overview" ? (
                <>
                  {/* Progress */}
                  <div className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Progress</span>
                      <span className="text-sm font-bold" style={{ color: cfg.color }}>{pct}%</span>
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
                      <p className="text-xs font-semibold mb-1.5" style={{ color: "#6B7280" }}>Description</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#D1D5DB" }}>{project.description}</p>
                    </div>
                  )}

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Deadline",  value: project.deadline ? formatDate(project.deadline) : "—", icon: Calendar },
                      { label: "Budget",    value: project.budget > 0 ? `₹${project.budget?.toLocaleString()}` : "—", icon: TrendingUp },
                      { label: "Freelancer", value: project.owner?.name || "—", icon: CheckSquare },
                      { label: "Tasks",     value: project.taskStats ? `${project.taskStats.done || 0}/${project.taskStats.total || 0} done` : "—", icon: ListTodo },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-xl p-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon size={11} style={{ color: "#6B7280" }} />
                          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>{label}</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{value}</p>
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

// ── Project card ──────────────────────────────────────────
const ProjectCard = ({ project, delay, onSelect }) => {
  const pct = project.progress ?? 0;
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onSelect(project)}
      className="relative rounded-2xl p-5 overflow-hidden cursor-pointer group transition-all duration-200"
      style={{
        background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${cfg.color}30`;
        e.currentTarget.style.boxShadow = `0 4px 32px rgba(0,0,0,0.3),0 0 0 1px ${cfg.color}15`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.2)";
      }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle,${cfg.color}10 0%,transparent 70%)`, transform: "translate(30%,-30%)" }} />

      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}28` }}>
          <FolderOpen size={17} style={{ color: cfg.color }} />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          <ChevronRight size={14} style={{ color: "#4B5563" }}
            className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-1 leading-snug">{project.title}</h3>
      {project.description && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: "#6B7280" }}>{project.description}</p>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Progress</span>
          <span className="text-xs font-bold" style={{ color: cfg.color }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: delay + 0.2, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg,${cfg.color},${cfg.color}80)` }} />
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {project.deadline && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} style={{ color: "#6B7280" }} />
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Due {formatDate(project.deadline)}</span>
          </div>
        )}
        {project.budget > 0 && (
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} style={{ color: "#6B7280" }} />
            <span className="text-xs" style={{ color: "#9CA3AF" }}>₹{project.budget?.toLocaleString()}</span>
          </div>
        )}
        {project.taskStats && (
          <div className="flex items-center gap-1.5 ml-auto">
            <CheckSquare size={11} style={{ color: "#6B7280" }} />
            <span className="text-xs" style={{ color: "#9CA3AF" }}>
              {project.taskStats.done || 0}/{project.taskStats.total || 0} tasks
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Main component ────────────────────────────────────────
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
    completed: projects.filter((p) => p.status === "completed").length,
    on_hold:   projects.filter((p) => p.status === "on_hold").length,
  }), [projects]);

  const STATUS_OPTS = ["all","planning","active","on_hold","completed","cancelled"];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Your Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {projects.length > 0 && (
          <div className="hidden sm:flex items-center gap-3">
            {[
              { label: "Active",    count: counts.active,    color: "#22C55E" },
              { label: "Completed", count: counts.completed, color: "#60A5FA" },
              { label: "On Hold",   count: counts.on_hold,   color: "#F59E0B" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-semibold" style={{ color }}>{count} {label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6B7280" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F9FAFB" }}
            onFocus={e => e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"}
            onBlur={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#6B7280" }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} style={{ color: "#6B7280" }} />
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150"
              style={{
                background: statusFilter === s ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.04)",
                color: statusFilter === s ? "#A78BFA" : "#6B7280",
                border: statusFilter === s ? "1px solid rgba(99,91,255,0.35)" : "1px solid rgba(255,255,255,0.07)",
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
          <AlertCircle size={28} style={{ color: "#EF4444" }} />
          <p className="text-sm text-white">Failed to load projects</p>
          <button onClick={fetchProjects} className="text-xs px-4 py-2 rounded-lg"
            style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <FolderOpen size={32} style={{ color: "#374151" }} />
          <p className="text-sm font-medium text-white">
            {projects.length > 0 ? "No projects match your filters" : "No projects yet"}
          </p>
          {(search || statusFilter !== "all") && (
            <button onClick={() => { setSearch(""); setStatus("all"); }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(99,91,255,0.15)", color: "#A78BFA" }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ProjectCard key={p._id} project={p} delay={i * 0.05} onSelect={setSelected} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Project detail drawer */}
      <ProjectDrawer project={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default ClientProjects;
