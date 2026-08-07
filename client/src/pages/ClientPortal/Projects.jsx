import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Search, Filter, Calendar,
  AlertCircle, X, TrendingUp, CheckSquare,
  Clock, ChevronRight, ListTodo, Circle,
  CheckCircle2, Loader2, RefreshCw, FolderKanban,
  LayoutGrid, ArrowUpRight, BarChart2, Download,
  Plus, Users, DollarSign, Send, Check, ShieldCheck, Tag, Sparkles
} from "lucide-react";
import useClientPortalStore from "../../store/clientPortalStore";
import { SkeletonCard } from "../../components/ui/Skeleton";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  open:      { color: "#38BDF8", bg: "rgba(56,189,248,0.15)",  label: "Open for Proposals" },
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

const CATEGORIES = [
  "Web Development",
  "Mobile App Development",
  "UI/UX Design",
  "AI & Data Science",
  "Writing & Content",
  "Marketing & SEO",
  "General",
];

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

// ── Glass Container Card ───────────────────────────────────────────────────
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

// ── Post Project Modal ──────────────────────────────────────────────────────
const PostProjectModal = ({ open, onClose }) => {
  const { postProject } = useClientPortalStore();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Web Development",
    requiredSkills: "",
    budget: "",
    currency: "USD",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please enter project title and description");
      return;
    }
    setLoading(true);
    try {
      const skillsArray = form.requiredSkills
        ? form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      await postProject({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        requiredSkills: skillsArray,
        budget: Number(form.budget) || 0,
        currency: form.currency,
        deadline: form.deadline ? new Date(form.deadline) : undefined,
      });
      onClose();
    } catch {
      /* handled in store */
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
        
        <motion.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
          className="relative w-full max-w-xl rounded-3xl overflow-hidden z-10 p-6 sm:p-8"
          style={{
            background: "linear-gradient(160deg,rgba(15,23,42,0.98) 0%,rgba(8,14,26,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(99,91,255,0.15)",
          }}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Post New Project</h2>
                <p className="text-xs text-slate-400">Post a project for freelancers to explore & apply</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Project Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Modern Full-Stack E-Commerce Web App"
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white outline-none focus:border-indigo-500">
                  {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Required Skills (Comma separated)</label>
                <input type="text" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                  placeholder="React, Node.js, Tailwind, MongoDB"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Budget</label>
                <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="1500"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white outline-none focus:border-indigo-500">
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Project Scope & Description *</label>
              <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detail the scope of work, requirements, deliverables, and expectations..."
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-indigo-500 leading-relaxed resize-none" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 cursor-pointer disabled:opacity-50">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>Post Project Now</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ── Proposals Drawer Modal ──────────────────────────────────────────────────
const ProposalsDrawer = ({ project, onClose }) => {
  const { fetchProposalsForProject, respondToProposal } = useClientPortalStore();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    if (project) {
      setLoading(true);
      fetchProposalsForProject(project._id)
        .then(setProposals)
        .finally(() => setLoading(false));
    }
  }, [project]);

  if (!project) return null;

  const handleRespond = async (proposalId, action) => {
    setActionId(proposalId);
    try {
      await respondToProposal(proposalId, action);
      setProposals((prev) =>
        prev.map((p) => (p._id === proposalId ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p))
      );
      if (action === "approve") onClose();
    } catch {
      /* handled */
    } finally {
      setActionId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-[#090E1A] border-l border-white/10 h-full overflow-y-auto z-10 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#0B1120]/95 backdrop-blur-md border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-cyan-400" />
                <h2 className="text-base font-bold text-white truncate max-w-md">Proposals for {project.title}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{proposals.length} proposal(s) submitted by freelancers</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-36 rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                  <Users size={28} />
                </div>
                <p className="text-sm font-bold text-white">No proposals received yet</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Freelancers are currently reviewing your project listing. Submitted applications will appear here.
                </p>
              </div>
            ) : (
              proposals.map((prop) => {
                const freelancer = prop.freelancer || {};
                const isApproved = prop.status === "approved";
                const isRejected = prop.status === "rejected";

                return (
                  <div key={prop._id} className={`rounded-2xl p-5 border transition-all ${
                    isApproved ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10" : "bg-slate-900/80 border-slate-800"
                  }`}>
                    {/* Freelancer Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden shrink-0">
                          {freelancer.avatar ? (
                            <img src={freelancer.avatar} alt={freelancer.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            freelancer.name?.slice(0, 2).toUpperCase() || "FL"
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {freelancer.name || "Freelancer"}
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {freelancer.title || "Freelancer Developer"}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{freelancer.email}</p>
                        </div>
                      </div>

                      {/* Bid Info */}
                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-emerald-400">
                          {prop.currency === "INR" ? "₹" : "$"}{prop.bidAmount?.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">{prop.estimatedDays} days timeframe</p>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 mb-4 text-xs text-slate-300 leading-relaxed font-medium">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Cover Letter & Proposal</p>
                      {prop.coverLetter}
                    </div>

                    {/* Freelancer Skills */}
                    {freelancer.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {freelancer.skills.map((sk) => (
                          <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-[11px] text-slate-400">Submitted {formatDate(prop.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        {isApproved ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                            <CheckCircle2 size={15} /> Approved & Hired
                          </span>
                        ) : isRejected ? (
                          <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                            Rejected
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRespond(prop._id, "reject")}
                              disabled={actionId === prop._id}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer">
                              Reject
                            </button>
                            <button
                              onClick={() => handleRespond(prop._id, "approve")}
                              disabled={actionId === prop._id}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer">
                              {actionId === prop._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                              <span>Approve & Hire</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
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
                      { label: "Budget",     value: project.budget > 0 ? `${project.currency === "INR" ? "₹" : "$"}${project.budget?.toLocaleString()}` : "—", icon: TrendingUp },
                      { label: "Freelancer", value: project.assignedFreelancer?.name || project.owner?.name || "Unassigned", icon: CheckSquare },
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
const ProjectCard = ({ project, delay, onSelect, onOpenProposals }) => {
  const pct = project.progress ?? 0;
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const isOwnerClient = project.createdByRole === "client" || project.status === "open";

  return (
    <GCard delay={delay} glow={cfg.color} className="p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between mb-3" onClick={() => onSelect(project)}>
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

        <h3 onClick={() => onSelect(project)} className="text-sm font-bold text-white mb-1.5 leading-snug group-hover:text-indigo-400 transition-colors cursor-pointer">
          {project.title}
        </h3>
        {project.description && (
          <p onClick={() => onSelect(project)} className="text-xs font-medium mb-4 line-clamp-2 cursor-pointer" style={{ color: "rgba(148,163,184,0.6)" }}>
            {project.description}
          </p>
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
      </div>

      <div className="space-y-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-400">
          {project.deadline && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-500" />
              <span>Due {formatDate(project.deadline)}</span>
            </div>
          )}
          {project.budget > 0 && (
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <TrendingUp size={12} className="text-emerald-400" />
              <span>{project.currency === "INR" ? "₹" : "$"}{project.budget?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Button for Proposals */}
        {isOwnerClient && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenProposals(project); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer">
            <Users size={14} />
            <span>View Proposals ({project.proposalsCount || 0})</span>
          </button>
        )}
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
  const [proposalProject, setProposalProject] = useState(null);
  const [postModalOpen, setPostModalOpen]     = useState(false);

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
    open:      projects.filter((p) => p.status === "open").length,
    active:    projects.filter((p) => p.status === "active").length,
    planning:  projects.filter((p) => p.status === "planning").length,
    completed: projects.filter((p) => p.status === "completed").length,
  }), [projects]);

  const STATUS_OPTS = ["all", "open", "planning", "active", "on_hold", "completed", "cancelled"];

  const handleExportCSV = () => {
    const list = filtered.length ? filtered : projects;
    const rows = [
      ["Project Title", "Status", "Progress (%)", "Deadline", "Budget", "Tasks Done", "Total Tasks"],
      ...list.map((p) => [
        `"${(p.title || "").replace(/"/g, '""')}"`,
        `"${p.status || ""}"`,
        p.progress ?? 0,
        `"${p.deadline ? new Date(p.deadline).toLocaleDateString() : ""}"`,
        p.budget || 0,
        p.taskStats?.done || 0,
        p.taskStats?.total || 0,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `projects_export_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
              Client Projects & Proposals
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Post projects for proposals, review applications, and manage active workstreams
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchProjects}
              title="Refresh Data"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.75)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.75)"; }}
            >
              <RefreshCw size={15} className={loading.projects ? "animate-spin text-indigo-400" : ""} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </motion.button>

            {/* Post Project Primary Action Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPostModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.4)" }}
            >
              <Plus size={16} />
              <span>Post New Project</span>
            </motion.button>
          </div>
        </motion.div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SubpageStatCard icon={Sparkles}     label="Open Proposals"    value={counts.open}      color="cyan"  delay={0}    sub="Open for freelancer bids" />
        <SubpageStatCard icon={FolderOpen}   label="Active Workstreams" value={counts.active}    color="green" delay={0.05} sub="Currently in development" />
        <SubpageStatCard icon={Clock}        label="Planning Phase"     value={counts.planning}  color="#9CA3AF" delay={0.1} sub="Scope & milestone setup" />
        <SubpageStatCard icon={CheckCircle2} label="Completed Projects" value={counts.completed} color="blue" delay={0.15} sub="Delivered & signed off" />
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
            {projects.length > 0 ? "No projects match your active filters" : "No projects posted yet"}
          </p>
          <p className="text-xs font-medium max-w-sm text-slate-400">
            {projects.length > 0
              ? "Try adjusting your search criteria or status filter."
              : "Post your first project to invite top freelancers to submit proposals and bids."}
          </p>
          {projects.length === 0 ? (
            <button onClick={() => setPostModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl mt-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Plus size={15} />
              <span>Post Your First Project</span>
            </button>
          ) : (
            <button onClick={() => { setSearch(""); setStatus("all"); }}
              className="text-xs font-bold px-4 py-2 rounded-xl mt-1 cursor-pointer bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Clear Filters
            </button>
          )}
        </GCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ProjectCard key={p._id} project={p} delay={i * 0.04} onSelect={setSelected} onOpenProposals={setProposalProject} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProjectDrawer project={selected} onClose={() => setSelected(null)} />
      <ProposalsDrawer project={proposalProject} onClose={() => setProposalProject(null)} />
      <PostProjectModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
      </div>
    </div>
  );
};

export default ClientProjects;
