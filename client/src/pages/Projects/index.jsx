import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FolderKanban, Search, LayoutGrid, List,
  Trash2, Pencil, Calendar, DollarSign, ArrowRight,
  Sparkles, ChevronDown, ExternalLink,
} from "lucide-react";
import useProjectStore from "../../store/projectStore";
import Modal from "../../components/ui/Modal";
import { formatDate, formatCurrency } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "",           label: "All statuses" },
  { value: "planning",   label: "Planning"     },
  { value: "active",     label: "Active"       },
  { value: "on_hold",    label: "On Hold"      },
  { value: "completed",  label: "Completed"    },
  { value: "cancelled",  label: "Cancelled"    },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "budget", label: "Highest budget" },
];

const STATUS_STYLE = {
  planning:  { dot: "#9CA3AF", bg: "rgba(156,163,175,0.12)", text: "#9CA3AF", label: "Planning"   },
  active:    { dot: "#22C55E", bg: "rgba(34,197,94,0.12)",   text: "#22C55E", label: "Active"     },
  on_hold:   { dot: "#F59E0B", bg: "rgba(245,158,11,0.12)",  text: "#F59E0B", label: "On Hold"    },
  completed: { dot: "#00D4FF", bg: "rgba(0,212,255,0.12)",   text: "#00D4FF", label: "Completed"  },
  cancelled: { dot: "#EF4444", bg: "rgba(239,68,68,0.12)",   text: "#EF4444", label: "Cancelled"  },
};

// ─────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.planning;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}25` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl p-5 animate-pulse"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
    <div className="flex items-start justify-between mb-4">
      <div className="h-4 w-2/3 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="h-6 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="h-3 w-4/5 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
    <div className="h-1.5 w-full rounded-full mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
    <div className="flex justify-between">
      <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="h-3 w-16 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────
const EmptyState = ({ hasSearch, onNew, onAI }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center py-24 text-center relative"
  >
    {/* Radial glow */}
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.07) 0%, transparent 70%)" }} />
    </div>

    {/* Floating icon */}
    <div className="relative mb-8">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(99,91,255,0.15) 0%, rgba(139,92,246,0.08) 100%)",
          border: "1px solid rgba(99,91,255,0.25)",
          boxShadow: "0 0 48px rgba(99,91,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <FolderKanban size={40} style={{ color: "#635BFF" }} strokeWidth={1.4} />
      </motion.div>

      {/* Orbiting dots */}
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i === 0 ? "#635BFF" : i === 1 ? "#00D4FF" : "#8B5CF6",
            boxShadow: `0 0 8px ${i === 0 ? "#635BFF" : i === 1 ? "#00D4FF" : "#8B5CF6"}`,
            top: i === 0 ? "-4px" : i === 1 ? "50%" : "auto",
            bottom: i === 2 ? "-4px" : "auto",
            left: i === 1 ? "-4px" : "50%",
            transform: i === 1 ? "translateY(-50%)" : "translateX(-50%)",
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        />
      ))}
    </div>

    {hasSearch ? (
      <>
        <h3 className="text-xl font-bold mb-2" style={{ color: "#F9FAFB" }}>No projects found</h3>
        <p className="text-sm max-w-xs" style={{ color: "#6B7280" }}>
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </>
    ) : (
      <>
        <h3 className="text-2xl font-bold mb-3"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
          No projects yet
        </h3>
        <p className="text-sm max-w-sm leading-relaxed mb-8" style={{ color: "#6B7280" }}>
          Start managing your freelance work by creating your first project.
          Track progress, budgets, and deadlines all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(99,91,255,0.5)" }}
            whileTap={{ scale: 0.96 }}
            onClick={onNew}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Create your first project
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAI}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#A78BFA",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(139,92,246,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(139,92,246,0.1)"}
          >
            <Sparkles size={14} />
            Generate with AI
          </motion.button>
        </div>

        {/* Hint */}
        <p className="mt-6 text-xs flex items-center gap-1.5" style={{ color: "#374151" }}>
          <Sparkles size={10} style={{ color: "#635BFF" }} />
          AI can generate a full project structure from just a title
        </p>
      </>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// PROJECT CARD (grid view)
// ─────────────────────────────────────────────────────────
const ProjectCard = ({ project: p, index, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ delay: index * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="relative rounded-2xl p-5 flex flex-col gap-4 group cursor-pointer"
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(12px)",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.border = "1px solid rgba(99,91,255,0.3)";
      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,91,255,0.15)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {/* Hover glow */}
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: "radial-gradient(circle, rgba(99,91,255,0.12) 0%, transparent 70%)" }} />

    {/* Top row */}
    <div className="flex items-start justify-between gap-2">
      <Link to={`/projects/${p._id}`}
        className="text-sm font-semibold line-clamp-1 flex-1 transition-colors duration-150"
        style={{ color: "#F9FAFB" }}
        onMouseEnter={e => e.target.style.color = "#A78BFA"}
        onMouseLeave={e => e.target.style.color = "#F9FAFB"}>
        {p.title}
      </Link>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-100"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.15)"; e.currentTarget.style.color = "#A78BFA"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
          <Pencil size={11} />
        </button>
        <button onClick={(e) => { e.preventDefault(); onDelete(p._id); }}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-100"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>

    {/* Description */}
    <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "#6B7280" }}>
      {p.description || "No description provided"}
    </p>

    {/* Progress bar */}
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px]" style={{ color: "#4B5563" }}>Progress</span>
        <span className="text-[10px] font-semibold" style={{ color: "#635BFF" }}>{p.progress || 0}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p.progress || 0}%` }}
          transition={{ duration: 0.8, delay: index * 0.05 + 0.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #635BFF, #00D4FF)" }}
        />
      </div>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <StatusBadge status={p.status} />
      <div className="text-right">
        <p className="text-xs font-semibold" style={{ color: "#E5E7EB" }}>{formatCurrency(p.budget, p.currency)}</p>
        <p className="text-[10px]" style={{ color: "#4B5563" }}>{formatDate(p.deadline)}</p>
      </div>
    </div>

    {/* Open link */}
    <Link to={`/projects/${p._id}`}
      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <ExternalLink size={12} style={{ color: "#635BFF" }} />
    </Link>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// PROJECT ROW (list view)
// ─────────────────────────────────────────────────────────
const ProjectRow = ({ project: p, index, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0 }}
    transition={{ delay: index * 0.04 }}
    className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-150 group"
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
      <FolderKanban size={14} style={{ color: "#635BFF" }} />
    </div>
    <div className="flex-1 min-w-0">
      <Link to={`/projects/${p._id}`} className="text-sm font-medium truncate block transition-colors duration-150"
        style={{ color: "#E5E7EB" }}
        onMouseEnter={e => e.target.style.color = "#A78BFA"}
        onMouseLeave={e => e.target.style.color = "#E5E7EB"}>
        {p.title}
      </Link>
      <p className="text-xs truncate mt-0.5" style={{ color: "#4B5563" }}>{p.description || "—"}</p>
    </div>
    <StatusBadge status={p.status} />
    <div className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
      <DollarSign size={11} />{formatCurrency(p.budget, p.currency)}
    </div>
    <div className="hidden lg:flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
      <Calendar size={11} />{formatDate(p.deadline)}
    </div>
    <button onClick={() => onDelete(p._id)}
      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
      style={{ color: "#6B7280" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
      <Trash2 size={13} />
    </button>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// PROJECT FORM (inside modal)
// ─────────────────────────────────────────────────────────
const ProjectForm = ({ onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    title: "", description: "", budget: "", deadline: "", status: "planning",
  });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F9FAFB",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const labelStyle = { color: "#9CA3AF", fontSize: "12px", fontWeight: 600, marginBottom: 6, display: "block" };

  const focusStyle = (e) => {
    e.target.style.border = "1px solid rgba(99,91,255,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)";
  };
  const blurStyle = (e) => {
    e.target.style.border = "1px solid rgba(255,255,255,0.09)";
    e.target.style.boxShadow = "none";
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label style={labelStyle}>Project title *</label>
        <input name="title" placeholder="e.g. Brand Redesign" value={form.title} onChange={set}
          required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" placeholder="What's this project about?" value={form.description}
          onChange={set} rows={3}
          style={{ ...inputStyle, resize: "none" }} onFocus={focusStyle} onBlur={blurStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Budget (₹)</label>
          <input name="budget" type="number" min="0" placeholder="0" value={form.budget} onChange={set}
            style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div>
          <label style={labelStyle}>Deadline</label>
          <input name="deadline" type="date" value={form.deadline} onChange={set}
            style={{ ...inputStyle, colorScheme: "dark" }} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Status</label>
        <select name="status" value={form.status} onChange={set}
          style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusStyle} onBlur={blurStyle}>
          {STATUS_OPTIONS.slice(1).map((o) => (
            <option key={o.value} value={o.value} style={{ background: "#0D1526" }}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
          Cancel
        </button>
        <motion.button type="submit" whileTap={{ scale: 0.97 }}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150"
          style={{
            background: loading ? "rgba(99,91,255,0.5)" : "linear-gradient(135deg,#635BFF,#8B5CF6)",
            boxShadow: loading ? "none" : "0 0 16px rgba(99,91,255,0.35)",
          }}>
          {loading ? "Creating…" : "Create Project"}
        </motion.button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────
// STYLED DROPDOWN
// ─────────────────────────────────────────────────────────
const StyledSelect = ({ value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={onChange}
      className="appearance-none h-9 pl-3 pr-8 rounded-xl text-xs font-medium outline-none transition-all duration-150 cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: value ? "#E5E7EB" : "#6B7280",
      }}
      onFocus={e => { e.target.style.border = "1px solid rgba(99,91,255,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.1)"; }}
      onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}>
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0D1526", color: "#F9FAFB" }}>{o.label}</option>
      ))}
    </select>
    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4B5563" }} />
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
const Projects = () => {
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort]           = useState("newest");
  const [view, setView]           = useState("grid");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (data) => {
    setCreating(true);
    await createProject(data);
    setCreating(false);
    setShowModal(false);
  };

  // Filter + sort
  let filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });
  if (sort === "oldest")  filtered = [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sort === "budget")  filtered = [...filtered].sort((a, b) => (b.budget || 0) - (a.budget || 0));

  const hasSearch = !!(search || statusFilter);

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 25% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 75% 100%, rgba(0,212,255,0.04) 0%, transparent 55%)",
      }}>
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Projects
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              {isLoading ? "Loading…" : projects.length === 0 ? "No projects yet" : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={15} strokeWidth={2.5} />
            New Project
          </motion.button>
        </motion.div>

        {/* ── FILTER BAR ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}>
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: searchFocused ? "#635BFF" : "#4B5563" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search projects…"
              className="w-full h-9 pl-9 pr-4 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: searchFocused ? "1px solid rgba(99,91,255,0.45)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: searchFocused ? "0 0 0 3px rgba(99,91,255,0.12)" : "none",
                color: "#F9FAFB",
              }}
            />
          </div>

          {/* Status filter */}
          <StyledSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />

          {/* Sort */}
          <StyledSelect value={sort} onChange={(e) => setSort(e.target.value)} options={SORT_OPTIONS} />

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-0.5 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {[["grid", LayoutGrid], ["list", List]].map(([v, Icon]) => (
              <motion.button key={v} onClick={() => setView(v)}
                whileTap={{ scale: 0.92 }}
                className="w-8 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: view === v ? "rgba(99,91,255,0.2)" : "transparent",
                  color: view === v ? "#A78BFA" : "#4B5563",
                  border: view === v ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                }}>
                <Icon size={14} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── CONTENT ── */}
        {isLoading ? (
          <div className={view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "space-y-2"}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={hasSearch} onNew={() => setShowModal(true)} onAI={() => {}} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <ProjectCard key={p._id} project={p} index={i} onDelete={deleteProject} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* List header */}
            <div className="flex items-center gap-4 px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["Project", "Status", "Budget", "Deadline"].map((h) => (
                <span key={h} className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: "#374151", flex: h === "Project" ? 1 : "none", width: h !== "Project" ? 100 : undefined }}>
                  {h}
                </span>
              ))}
              <span className="w-7" />
            </div>
            <AnimatePresence>
              {filtered.map((p, i) => (
                <ProjectRow key={p._id} project={p} index={i} onDelete={deleteProject} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title="New Project" description="Fill in the details to create a new project">
        <ProjectForm onSubmit={handleCreate} onClose={() => setShowModal(false)} loading={creating} />
      </Modal>
    </div>
  );
};

export default Projects;
