import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, CheckSquare, Sparkles, LayoutGrid,
  Filter, ChevronDown,
} from "lucide-react";
import useProjectStore from "../../store/projectStore";
import KanbanBoard from "../../components/projects/KanbanBoard";
import { formatDate } from "../../utils/helpers";

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
        <CheckSquare size={40} style={{ color: "#635BFF" }} strokeWidth={1.4} />
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
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
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
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
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
          <select name="priority" value={form.priority} onChange={set}
            style={{ ...inputStyle, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p} style={{ background: "#0D1526", color: "#F9FAFB" }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select name="status" value={form.status} onChange={set}
            style={{ ...inputStyle, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} style={{ background: "#0D1526", color: "#F9FAFB" }}>{s.label}</option>
            ))}
          </select>
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
          <select name="projectId" value={form.projectId} onChange={set}
            style={{ ...inputStyle, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
            {projects.map((p) => (
              <option key={p._id} value={p._id} style={{ background: "#0D1526", color: "#F9FAFB" }}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
          Cancel
        </button>
        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
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
          className="absolute inset-0" style={{ background: "rgba(4,8,18,0.8)", backdropFilter: "blur(10px)" }}
          onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10"
          style={{
            background: "linear-gradient(160deg,rgba(13,20,40,0.99) 0%,rgba(8,14,28,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 0 0 1px rgba(99,91,255,0.15), 0 32px 64px rgba(0,0,0,0.7)",
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.4),transparent)" }} />
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>{title}</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#E5E7EB"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
              ✕
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
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

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(0,212,255,0.04) 0%, transparent 55%)",
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
              Tasks
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(99,91,255,0.12)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.2)" }}>
                {tasks.length} Task{tasks.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs" style={{ color: "#374151" }}>•</span>
              <span className="text-xs flex items-center gap-1" style={{ color: "#374151" }}>
                <LayoutGrid size={10} /> Kanban View
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAddTask()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={15} strokeWidth={2.5} />
            Add Task
          </motion.button>
        </motion.div>

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
