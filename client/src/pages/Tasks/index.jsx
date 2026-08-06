import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ListTodo, Sparkles, LayoutGrid,
  Filter, ChevronDown, X,
} from "lucide-react";
import useProjectStore from "../../store/projectStore";
import KanbanBoard from "../../components/projects/KanbanBoard";
import { formatDate } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// CUSTOM DARK GLASS DROPDOWN
// ─────────────────────────────────────────────────────────
const CustomDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3.5 rounded-xl text-xs font-semibold text-white flex items-center justify-between gap-2.5 transition-all duration-150 cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: open ? "1px solid rgba(99,91,255,0.45)" : "1px solid rgba(255,255,255,0.09)",
          boxShadow: open ? "0 0 0 3px rgba(99,91,255,0.12)" : "none",
        }}
      >
        <span className="truncate">{selected?.label || selected?.title || value}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 text-slate-400 shrink-0 ${open ? "rotate-180 text-indigo-400" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 z-50 w-full p-1.5 rounded-xl border border-slate-700/80 shadow-2xl space-y-0.5 backdrop-blur-xl max-h-48 overflow-y-auto"
            style={{ background: "rgba(13,21,38,0.96)" }}
          >
            {options.map((o) => {
              const val = o.value !== undefined ? o.value : o._id || o;
              const lbl = o.label || o.title || (typeof o === "string" ? o.charAt(0).toUpperCase() + o.slice(1) : o);
              const isSel = val === value;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    onChange(val);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-all cursor-pointer ${
                    isSel ? "bg-indigo-600/30 text-white font-bold border border-indigo-500/40" : "hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <span className="truncate">{lbl}</span>
                  {isSel && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// SKELETON COLUMN
// ─────────────────────────────────────────────────────────
const SkeletonColumn = () => (
  <div className="flex flex-col gap-3 min-w-[260px] flex-1">
    <div className="flex items-center gap-2 px-1">
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
      <div className="h-3.5 w-20 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
    <div className="rounded-2xl p-2.5 min-h-[320px] space-y-2.5 animate-pulse"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", height: 80 }} />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center py-24 text-center relative"
  >
    {/* Radial glow */}
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.07) 0%, transparent 70%)" }} />
    </div>

    {/* Animated icon */}
    <div className="relative mb-8">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(99,91,255,0.15) 0%, rgba(139,92,246,0.08) 100%)",
          border: "1px solid rgba(99,91,255,0.25)",
          boxShadow: "0 0 48px rgba(99,91,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <ListTodo size={40} style={{ color: "#635BFF" }} strokeWidth={1.4} />
      </motion.div>

      {/* Floating mini kanban columns */}
      {[
        { x: -52, y: -8,  delay: 0,    color: "#9CA3AF" },
        { x: -52, y: 20,  delay: 0.3,  color: "#635BFF" },
        { x:  52, y: -8,  delay: 0.6,  color: "#F59E0B" },
        { x:  52, y: 20,  delay: 0.9,  color: "#22C55E" },
      ].map((dot, i) => (
        <motion.div key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: dot.color,
            boxShadow: `0 0 8px ${dot.color}`,
            left: `calc(50% + ${dot.x}px)`,
            top: `calc(50% + ${dot.y}px)`,
          }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: dot.delay }}
        />
      ))}
    </div>

    <h3 className="text-2xl font-bold mb-3"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
      No tasks yet
    </h3>
    <p className="text-sm max-w-sm leading-relaxed mb-8" style={{ color: "#6B7280" }}>
      Create tasks inside a project to start managing your workflow.
      Organize work across Kanban columns and track progress visually.
    </p>

    <div className="flex flex-col sm:flex-row items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(99,91,255,0.5)" }}
        whileTap={{ scale: 0.96 }}
        onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
          boxShadow: "0 0 20px rgba(99,91,255,0.35)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Add your first task
      </motion.button>
    </div>

    <p className="mt-5 text-xs flex items-center gap-1.5" style={{ color: "#374151" }}>
      <LayoutGrid size={10} style={{ color: "#635BFF" }} />
      Tip: Organize work with Kanban columns — Todo, In Progress, Review, Done
    </p>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// TASK FORM (modal content)
// ─────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
const STATUS_OPTIONS   = [
  { value: "todo",        label: "To Do"       },
  { value: "in_progress", label: "In Progress" },
  { value: "review",      label: "In Review"   },
  { value: "done",        label: "Done"        },
];

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F9FAFB",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const labelStyle = { color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };
const onFocus = (e) => { e.target.style.border = "1px solid rgba(99,91,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)"; };
const onBlur  = (e) => { e.target.style.border = "1px solid rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; };

const TaskForm = ({ projects, onSubmit, onClose, loading, defaultStatus }) => {
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium",
    status: defaultStatus || "todo", dueDate: "",
    projectId: projects[0]?._id || "",
  });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const projectOptions = projects.map(p => ({ value: p._id, label: p.title }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label style={labelStyle}>Task title *</label>
        <input name="title" placeholder="e.g. Design homepage mockup" value={form.title}
          onChange={set} required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" placeholder="Optional details…" value={form.description}
          onChange={set} rows={2} style={{ ...inputStyle, resize: "none" }} onFocus={onFocus} onBlur={onBlur} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Priority</label>
          <CustomDropdown value={form.priority} onChange={(val) => setForm(f => ({ ...f, priority: val }))} options={PRIORITY_OPTIONS} />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <CustomDropdown value={form.status} onChange={(val) => setForm(f => ({ ...f, status: val }))} options={STATUS_OPTIONS} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Due date</label>
          <input name="dueDate" type="date" value={form.dueDate} onChange={set}
            style={{ ...inputStyle, colorScheme: "dark" }} onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div>
          <label style={labelStyle}>Project</label>
          <CustomDropdown value={form.projectId} onChange={(val) => setForm(f => ({ ...f, projectId: val }))} options={projectOptions} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
          Cancel
        </button>
        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{
            background: loading ? "rgba(99,91,255,0.5)" : "linear-gradient(135deg,#635BFF,#8B5CF6)",
            boxShadow: loading ? "none" : "0 0 16px rgba(99,91,255,0.35)",
          }}>
          {loading ? "Creating…" : "Create Task"}
        </motion.button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────
// MODAL WRAPPER
// ─────────────────────────────────────────────────────────
const TaskModal = ({ isOpen, onClose, children, title }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden z-10 shadow-2xl"
          style={{
            background: "rgba(11,15,26,0.96)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 50px rgba(99,91,255,0.15)",
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.4),transparent)" }} />
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// MAIN TASKS PAGE
// ─────────────────────────────────────────────────────────
const Tasks = () => {
  const { tasks, projects, fetchProjects, createTask, isLoading } = useProjectStore();
  const [showModal, setShowModal]     = useState(false);
  const [creating, setCreating]       = useState(false);
  const [defaultStatus, setDefaultStatus] = useState("todo");

  useEffect(() => { fetchProjects(); }, []);

  const handleAddTask = (status = "todo") => {
    setDefaultStatus(status);
    setShowModal(true);
  };

  const handleCreate = async (form) => {
    if (!form.projectId) return;
    setCreating(true);
    await createTask(form);
    setCreating(false);
    setShowModal(false);
  };

  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const doneCount = tasks.filter(t => t.status === "done").length;

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Kanban Task Workflow
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Organize sprint tasks, track progress across Kanban columns & manage deliverables
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAddTask()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={15} strokeWidth={2.5} />
            Add Task
          </motion.button>
        </motion.div>

        {/* ── KPI METRICS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)", border: "1px solid rgba(99,91,255,0.25)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-300">Total Tasks</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-500/40">
                <ListTodo size={16} style={{ color: "#C4B5FD", filter: "drop-shadow(0 0 6px rgba(196,181,253,0.6))" }} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{tasks.length}</p>
            <p className="text-[11px] text-gray-400">Across all projects</p>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)", border: "1px solid rgba(245,158,11,0.25)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-300">To Do Queue</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/40">
                <Filter size={16} style={{ color: "#FDE68A", filter: "drop-shadow(0 0 6px rgba(253,230,138,0.6))" }} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{todoCount}</p>
            <p className="text-[11px] text-gray-400">Pending tasks</p>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)", border: "1px solid rgba(0,212,255,0.25)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-300">In Progress</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyan-500/20 border border-cyan-500/40">
                <Sparkles size={16} style={{ color: "#67E8F9", filter: "drop-shadow(0 0 6px rgba(103,232,249,0.6))" }} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{inProgressCount}</p>
            <p className="text-[11px] text-gray-400">Active execution</p>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)", border: "1px solid rgba(34,197,94,0.25)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-300">Completed</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40">
                <ListTodo size={16} style={{ color: "#6EE7B7", filter: "drop-shadow(0 0 6px rgba(110,231,183,0.6))" }} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{doneCount}</p>
            <p className="text-[11px] text-gray-400">Tasks verified done</p>
          </motion.div>
        </div>

        {/* ── CONTENT ── */}
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonColumn key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState onAdd={() => handleAddTask()} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <KanbanBoard onAddTask={handleAddTask} />
          </motion.div>
        )}
      </div>

      {/* ── TASK MODAL ── */}
      <TaskModal isOpen={showModal} onClose={() => setShowModal(false)} title="New Task">
        {projects.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "#6B7280" }}>
              You need at least one project before adding tasks.
            </p>
          </div>
        ) : (
          <TaskForm
            projects={projects}
            onSubmit={handleCreate}
            onClose={() => setShowModal(false)}
            loading={creating}
            defaultStatus={defaultStatus}
          />
        )}
      </TaskModal>
    </div>
  );
};

export default Tasks;
