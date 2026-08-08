import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Search, Filter, Calendar,
  AlertCircle, X, TrendingUp, CheckSquare,
  Clock, ChevronRight, ListTodo, Circle,
  CheckCircle2, Loader2, RefreshCw, FolderKanban,
  LayoutGrid, ArrowUpRight, BarChart2, Download,
  Plus, Users, DollarSign, Send, Check, ShieldCheck, Tag, Sparkles,
  MessageSquare, ArrowRight
} from "lucide-react";
import useClientPortalStore from "../../store/clientPortalStore";
import { SkeletonCard } from "../../components/ui/Skeleton";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import DatePicker from "../../components/ui/DatePicker";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  open:      { color: "#38BDF8", bg: "rgba(56,189,248,0.18)",  label: "Open for Bids" },
  planning:  { color: "#9CA3AF", bg: "rgba(156,163,175,0.18)", label: "Planning" },
  active:    { color: "#22C55E", bg: "rgba(34,197,94,0.18)",   label: "Active" },
  on_hold:   { color: "#F59E0B", bg: "rgba(245,158,11,0.18)",  label: "On Hold" },
  completed: { color: "#60A5FA", bg: "rgba(96,165,250,0.18)",  label: "Completed" },
  cancelled: { color: "#EF4444", bg: "rgba(239,68,68,0.18)",   label: "Cancelled" },
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
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm shrink-0"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}35`,
        boxShadow: `0 2px 10px ${s.color}15`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
        style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
      />
      {s.label}
    </span>
  );
};

// ── Glass Container Card ───────────────────────────────────────────────────
const GCard = ({ children, delay, className, glow, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    onClick={onClick}
    className={
      "relative overflow-hidden rounded-2xl transition-all duration-300 " +
      (className || "")
    }
    style={{
      background: "linear-gradient(145deg, rgba(15,23,42,0.85) 0%, rgba(9,14,26,0.92) 100%)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.09)",
      boxShadow: glow
        ? `0 10px 30px -10px ${glow}20, 0 0 20px ${glow}10`
        : "0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px rgba(99,91,255,0.05)",
    }}
  >
    {/* Top Shimmer Highlight */}
    <div
      className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{
        background: glow
          ? `linear-gradient(90deg, transparent, ${glow}70, transparent)`
          : "linear-gradient(90deg, transparent, rgba(99,91,255,0.35), transparent)",
      }}
    />
    {children}
  </motion.div>
);

// ── Task List Inside Drawer ────────────────────────────────────────────────
const TaskList = ({ projectId }) => {
  const { tasksByProject, loading, fetchTasks } = useClientPortalStore();
  const tasks = tasksByProject[projectId] || [];
  const isLoading = loading.tasks?.[projectId];

  useEffect(() => {
    fetchTasks(projectId);
  }, [projectId]);

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
      <div className="flex flex-col items-center py-10 gap-2 mt-3 text-center bg-slate-900/40 rounded-2xl border border-white/5 p-6">
        <ListTodo size={28} className="text-slate-500 mb-1" />
        <p className="text-xs font-bold text-slate-300">No active tasks listed yet</p>
        <p className="text-[11px] text-slate-400 max-w-xs">
          Tasks created for this project will appear here automatically.
        </p>
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
              <Icon size={13} style={{ color: cfg.color }} />
              <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${cfg.color}18`, color: cfg.color }}>{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((task) => (
                <div key={task._id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: PRIORITY_COLOR[task.priority] || "#9CA3AF" }} />
                  <p className="flex-1 text-xs font-semibold text-white truncate">{task.title}</p>
                  {task.dueDate && (
                    <span className="text-[10px] font-medium shrink-0 text-slate-400">
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
    if (!form.title.trim()) {
      toast.error("Please enter project title");
      return;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    if (!form.requiredSkills.trim()) {
      toast.error("Please enter required skills");
      return;
    }
    if (!form.budget || Number(form.budget) <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    if (!form.deadline) {
      toast.error("Please select a project deadline date");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter project scope and description");
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

  const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
  const CURRENCY_OPTIONS = [
    { value: "USD", label: "USD ($)" },
    { value: "INR", label: "INR (₹)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
  ];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="lg"
      icon={Plus}
      title="Post New Project"
      description="Post a project for freelancers to explore & apply"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Title"
          name="title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Modern Full-Stack E-Commerce Web App"
          className="bg-slate-900/80 border-slate-700/80 text-white placeholder-slate-500 text-xs h-10 rounded-xl focus:border-indigo-500"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            name="category"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={CATEGORY_OPTIONS}
          />

          <Input
            label="Required Skills (Comma separated)"
            name="requiredSkills"
            required
            value={form.requiredSkills}
            onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
            placeholder="React, Node.js, Tailwind, MongoDB"
            className="bg-slate-900/80 border-slate-700/80 text-white placeholder-slate-500 text-xs h-10 rounded-xl focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Budget"
            name="budget"
            type="number"
            min="1"
            required
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            placeholder="1500"
            prefix={form.currency === "INR" ? "₹" : "$"}
            className="bg-slate-900/80 border-slate-700/80 text-white placeholder-slate-500 text-xs h-10 rounded-xl focus:border-indigo-500"
          />

          <Select
            label="Currency"
            name="currency"
            required
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={CURRENCY_OPTIONS}
          />

          <DatePicker
            label="Deadline"
            name="deadline"
            required
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            placeholder="Select deadline..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1.5">
            Project Scope & Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detail the scope of work, requirements, deliverables, and expectations..."
            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-none transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Post Project Now</span>
          </button>
        </div>
      </form>
    </Modal>
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

  const drawerContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-[#090E1A] border-l border-white/10 h-full overflow-y-auto z-10 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#0B1120]/95 backdrop-blur-md border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-cyan-400" />
                <h2 className="text-base font-black text-white truncate max-w-md">Proposals for {project.title}</h2>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{proposals.length} proposal(s) submitted by freelancers</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
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
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
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
                          <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-[11px] text-slate-400 font-medium">Submitted {formatDate(prop.createdAt)}</span>
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

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
};

// ── Project Detail Drawer ──────────────────────────────────────────────────
const ProjectDrawer = ({ project, onClose, onOpenProposals }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const pct = project?.progress ?? 0;
  const cfg = STATUS_CONFIG[project?.status] || STATUS_CONFIG.planning;

  const drawerContent = (
    <AnimatePresence>
      {project && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md"
            onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-[10000] w-full max-w-lg overflow-y-auto flex flex-col"
            style={{
              background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "-24px 0 64px rgba(0,0,0,0.8)",
            }}>
            <div className="absolute top-0 left-0 bottom-0 w-px pointer-events-none"
              style={{ background: "linear-gradient(180deg,transparent,rgba(99,91,255,0.5),rgba(0,212,255,0.3),transparent)" }} />

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 shrink-0"
              style={{ background: "rgba(8,14,26,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}>
                  <FolderOpen size={18} style={{ color: cfg.color }} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={project.status} />
                    {project.category && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                        {project.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { id: "overview", label: "Overview", icon: BarChart2 },
                { id: "tasks", label: "Tasks", icon: ListTodo },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                  style={{
                    background: tab === id ? "linear-gradient(135deg,rgba(99,91,255,0.3) 0%,rgba(139,92,246,0.2) 100%)" : "rgba(255,255,255,0.03)",
                    color: tab === id ? "#F3E8FF" : "rgba(148,163,184,0.7)",
                    border: tab === id ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.05)",
                  }}>
                  <Icon size={14} className={tab === id ? "text-indigo-300" : "text-slate-400"} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Main Content Body */}
            <div className="p-6 space-y-5 flex-1">
              {tab === "overview" ? (
                <>
                  {/* Progress Bar Container */}
                  <div className="rounded-2xl p-4 bg-slate-900/80 border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-cyan-400" />
                        Project Completion
                      </span>
                      <span className="text-sm font-black text-cyan-400">{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden bg-slate-950/80 p-0.5 border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg,#38BDF8 0%,#635BFF 50%,#A78BFA 100%)" }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                      {project.taskStats ? `${project.taskStats.done || 0} of ${project.taskStats.total || 0} tasks completed` : "No tasks logged"}
                    </p>
                  </div>

                  {/* Required Skills & Category */}
                  {project.requiredSkills?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Tag size={12} className="text-indigo-400" />
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.requiredSkills.map((skill) => (
                          <span key={skill} className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {project.description && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Scope & Description</p>
                      <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/10 text-xs leading-relaxed font-medium text-slate-200">
                        {project.description}
                      </div>
                    </div>
                  )}

                  {/* Meta Grid - 4 Interactive Stat Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <Calendar size={13} className="text-cyan-400" />
                        <span>Deadline</span>
                      </div>
                      <p className="text-xs font-black text-white">
                        {project.deadline ? formatDate(project.deadline) : "Not Set"}
                      </p>
                    </div>

                    <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <TrendingUp size={13} className="text-emerald-400" />
                        <span>Budget</span>
                      </div>
                      <p className="text-xs font-black text-emerald-400">
                        {project.budget > 0 ? `${project.currency === "INR" ? "₹" : "$"}${project.budget?.toLocaleString()}` : "Unspecified"}
                      </p>
                    </div>

                    <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <CheckSquare size={13} className="text-indigo-400" />
                          <span>Freelancer</span>
                        </div>
                        {project.assignedFreelancer && (
                          <button
                            onClick={() => navigate("/messages")}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <MessageSquare size={10} /> Chat
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-black text-white truncate">
                        {project.assignedFreelancer?.name || project.owner?.name || "Unassigned"}
                      </p>
                    </div>

                    <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <ListTodo size={13} className="text-purple-400" />
                        <span>Tasks</span>
                      </div>
                      <p className="text-xs font-black text-white">
                        {project.taskStats ? `${project.taskStats.done || 0}/${project.taskStats.total || 0} done` : "0/0"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <TaskList projectId={project._id} />
              )}
            </div>

            {/* Sticky Drawer Footer Actions */}
            <div className="p-4 bg-slate-950/90 border-t border-white/10 flex items-center gap-3 shrink-0">
              {(project.createdByRole === "client" || project.status === "open") && (
                <button
                  onClick={() => { onClose(); onOpenProposals(project); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
                  <Users size={15} />
                  <span>View Proposals ({project.proposalsCount || 0})</span>
                </button>
              )}
              {project.assignedFreelancer && (
                <button
                  onClick={() => { onClose(); navigate("/messages"); }}
                  className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer">
                  <MessageSquare size={15} />
                  <span>Chat</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
};

// ── Project Card ───────────────────────────────────────────────────────────
const ProjectCard = ({ project, delay, onSelect, onOpenProposals }) => {
  const pct = project.progress ?? 0;
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const isOwnerClient = project.createdByRole === "client" || project.status === "open";

  return (
    <GCard delay={delay} glow={cfg.color} onClick={() => onSelect(project)} className="p-5 flex flex-col justify-between group">
      <div>
        {/* Card Header Row */}
        <div className="flex items-start justify-between mb-3.5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105"
            style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, boxShadow: `0 0 20px ${cfg.color}20` }}>
            <FolderOpen size={18} style={{ color: cfg.color }} />
          </div>
          <div className="flex items-center gap-2">
            {project.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60 hidden sm:inline-block">
                {project.category}
              </span>
            )}
            <StatusBadge status={project.status} />
            <ChevronRight size={15} className="text-slate-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-white mb-1.5 leading-snug group-hover:text-indigo-300 transition-colors">
          {project.title}
        </h3>

        {/* Description */}
        {project.description && (
          <p className="text-xs font-medium text-slate-400 mb-4 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Skill Badges Preview */}
        {project.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.requiredSkills.slice(0, 3).map((sk) => (
              <span key={sk} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {sk}
              </span>
            ))}
            {project.requiredSkills.length > 3 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                +{project.requiredSkills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress Bar Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400">Progress</span>
            <span className="text-xs font-black" style={{ color: cfg.color }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-slate-950/80 border border-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, delay: delay + 0.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#38BDF8 0%,#635BFF 50%,#A78BFA 100%)" }} />
          </div>
        </div>
      </div>

      {/* Card Footer & Proposal Action Button */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-slate-300">
          {project.deadline ? (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar size={13} className="text-slate-400" />
              <span>Due {formatDate(project.deadline)}</span>
            </div>
          ) : <span />}
          {project.budget > 0 && (
            <div className="flex items-center gap-1 font-black text-emerald-400">
              <TrendingUp size={13} className="text-emerald-400" />
              <span>{project.currency === "INR" ? "₹" : "$"}{project.budget?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Button for Proposals */}
        {isOwnerClient && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenProposals(project); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer">
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
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatus]     = useState("all");
  const [categoryFilter, setCategory] = useState("all");
  const [selected, setSelected]       = useState(null);
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
    if (categoryFilter !== "all") list = list.filter((p) => p.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  }, [projects, search, statusFilter, categoryFilter]);

  const counts = useMemo(() => ({
    all:       projects.length,
    open:      projects.filter((p) => p.status === "open").length,
    active:    projects.filter((p) => p.status === "active").length,
    planning:  projects.filter((p) => p.status === "planning").length,
    on_hold:   projects.filter((p) => p.status === "on_hold").length,
    completed: projects.filter((p) => p.status === "completed").length,
    cancelled: projects.filter((p) => p.status === "cancelled").length,
  }), [projects]);

  const STATUS_OPTS = [
    { id: "all", label: "All", count: counts.all },
    { id: "open", label: "Open", count: counts.open },
    { id: "planning", label: "Planning", count: counts.planning },
    { id: "active", label: "Active", count: counts.active },
    { id: "on_hold", label: "On Hold", count: counts.on_hold },
    { id: "completed", label: "Completed", count: counts.completed },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  const CATEGORY_OPTS = [
    { value: "all", label: "All Categories" },
    ...CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const handleExportCSV = () => {
    const list = filtered.length ? filtered : projects;
    const rows = [
      ["Project Title", "Status", "Category", "Progress (%)", "Deadline", "Budget", "Tasks Done", "Total Tasks"],
      ...list.map((p) => [
        `"${(p.title || "").replace(/"/g, '""')}"`,
        `"${p.status || ""}"`,
        `"${p.category || ""}"`,
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
      
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.06) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.2))",
              }}>
              Client Projects & Proposals
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </motion.button>

            {/* Post Project Primary Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPostModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.4)" }}
            >
              <Plus size={16} />
              <span>New Project</span>
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title or description..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F9FAFB",
              }}
              onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"; e.currentTarget.style.background = "rgba(99,91,255,0.06)"; }}
              onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }}>
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} style={{ color: "rgba(148,163,184,0.5)", marginRight: 2 }} />
            {["all", "open", "planning", "active", "on_hold", "completed", "cancelled"].map((s) => {
              const labels = {
                all: "All",
                open: "Open",
                planning: "Planning",
                active: "Active",
                on_hold: "On Hold",
                completed: "Completed",
                cancelled: "Cancelled",
              };
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 cursor-pointer"
                  style={{
                    background: statusFilter === s ? "linear-gradient(135deg,rgba(99,91,255,0.25) 0%,rgba(139,92,246,0.15) 100%)" : "rgba(255,255,255,0.04)",
                    color: statusFilter === s ? "#EDE9FE" : "rgba(148,163,184,0.7)",
                    border: statusFilter === s ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: statusFilter === s ? "0 0 12px rgba(99,91,255,0.18)" : "none",
                  }}
                >
                  {labels[s] || s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects Grid */}
        {loading.projects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error.projects ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-rose-500/20">
            <AlertCircle size={32} className="text-rose-400" />
            <p className="text-sm font-bold text-white">Failed to load project records</p>
            <p className="text-xs text-slate-400 max-w-sm">{error.projects}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-white/5">
            <FolderKanban size={36} className="text-slate-500" />
            <p className="text-sm font-bold text-white">No projects found</p>
            <p className="text-xs text-slate-400 max-w-xs">
              {search || statusFilter !== "all" || categoryFilter !== "all"
                ? "No project listings match your selected search filters."
                : "Post your first project to receive proposals from qualified freelancers."}
            </p>
            <button
              onClick={() => setPostModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Plus size={14} />
              <span>Post New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((proj, idx) => (
              <ProjectCard
                key={proj._id}
                project={proj}
                delay={idx * 0.05}
                onSelect={(p) => setSelected(p)}
                onOpenProposals={(p) => setProposalProject(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Drawer */}
      <ProjectDrawer
        project={selected}
        onClose={() => setSelected(null)}
        onOpenProposals={(p) => setProposalProject(p)}
      />

      {/* Proposals Drawer */}
      <ProposalsDrawer
        project={proposalProject}
        onClose={() => setProposalProject(null)}
      />

      {/* Post Project Modal */}
      <PostProjectModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
      />
    </div>
  );
};

export default ClientProjects;
