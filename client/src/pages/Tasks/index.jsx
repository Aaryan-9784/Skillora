import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ListTodo, Sparkles, LayoutGrid, List,
  Filter, ChevronDown, X, FolderKanban, Search, Trash2, Pencil,
} from "lucide-react";
import useProjectStore from "../../store/projectStore";
import KanbanBoard from "../../components/projects/KanbanBoard";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { formatDate } from "../../utils/helpers";

// ── Glass Container Card (Client Portal Standard) ──────────────────────────
const GCard = ({ children, delay, className = "", glow, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${className}`}
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
    {/* Top Shimmer Accent Line */}
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
// EMPTY STATE (Inside GCard Container)
// ─────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/10"
      style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)" }}>
      <ListTodo size={26} className="text-indigo-400" />
    </div>
    <h3 className="text-base font-bold text-white mb-1">No tasks yet</h3>
    <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-5">
      Create tasks inside a project to start managing your workflow across Kanban columns and track progress visually.
    </p>
    <motion.button
      whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,91,255,0.4)" }}
      whileTap={{ scale: 0.96 }}
      onClick={onAdd}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
      style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)", border: "1px solid rgba(255,255,255,0.15)" }}>
      <Plus size={15} strokeWidth={2.5} />
      <span>Add your first task</span>
    </motion.button>
  </div>
);

// ─────────────────────────────────────────────────────────
// SHARED FORM STYLES
// ─────────────────────────────────────────────────────────
const iStyle = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  color: "#F9FAFB", borderRadius: 12, padding: "10px 14px", fontSize: 13,
  outline: "none", width: "100%", transition: "border-color 0.15s, box-shadow 0.15s",
};
const lStyle = { color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };
const iFocus = (e) => { e.target.style.border = "1px solid rgba(99,91,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)"; };
const iBlur  = (e) => { e.target.style.border = "1px solid rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; };

// ─────────────────────────────────────────────────────────
// TASK FORM
// ─────────────────────────────────────────────────────────
const TaskForm = ({ projects, onSubmit, onClose, loading, defaultStatus = "todo" }) => {
  const [form, setForm] = useState({
    title: "", description: "", projectId: projects[0]?._id || "",
    status: defaultStatus, priority: "medium", dueDate: "",
  });

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label style={lStyle}>Project *</label>
        <CustomDropdown
          value={form.projectId}
          onChange={(val) => setForm((f) => ({ ...f, projectId: val }))}
          options={projects.map((p) => ({ value: p._id, label: p.title }))}
        />
      </div>

      <div>
        <label style={lStyle}>Task Title *</label>
        <input name="title" placeholder="e.g. Design Landing Page Hero" value={form.title} onChange={set}
          required style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>

      <div>
        <label style={lStyle}>Description</label>
        <textarea name="description" placeholder="Add task details..." value={form.description} onChange={set}
          rows={3} style={{ ...iStyle, resize: "none" }} onFocus={iFocus} onBlur={iBlur} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={lStyle}>Priority</label>
          <CustomDropdown
            value={form.priority}
            onChange={(val) => setForm((f) => ({ ...f, priority: val }))}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "urgent", label: "Urgent" },
            ]}
          />
        </div>
        <div>
          <label style={lStyle}>Due Date</label>
          <input name="dueDate" type="date" value={form.dueDate} onChange={set}
            style={{ ...iStyle, colorScheme: "dark" }} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-white/5 hover:bg-white/10 cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/30 cursor-pointer">
          {loading ? "Creating…" : "Create Task"}
        </button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────
// TASK MODAL
// ─────────────────────────────────────────────────────────
const TaskModal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-3xl overflow-hidden z-10 shadow-2xl"
          style={{
            background: "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(10,16,30,0.98) 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 50px rgba(99,91,255,0.15)",
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.5),transparent)" }} />
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-base font-black tracking-tight text-white">{title}</h2>
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
  const { projects, tasks, fetchProjects, fetchTasks, createTask, deleteTask, isLoading } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [search, setSearch]                       = useState("");
  const [view, setView]                           = useState("kanban"); // "kanban" | "list"
  const [showModal, setShowModal]                 = useState(false);
  const [creating, setCreating]                   = useState(false);
  const [defaultStatus, setDefaultStatus]         = useState("todo");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      const targetId = selectedProjectId || projects[0]._id;
      if (!selectedProjectId) setSelectedProjectId(targetId);
      fetchTasks(targetId);
    } else {
      useProjectStore.setState({ tasks: [] });
    }
  }, [projects, selectedProjectId]);

  const handleAddTask = (status = "todo") => {
    setDefaultStatus(status);
    setShowModal(true);
  };

  const handleCreate = async (form) => {
    setCreating(true);
    try {
      await createTask(form);
      setShowModal(false);
      if (selectedProjectId) fetchTasks(selectedProjectId);
    } finally {
      setCreating(false);
    }
  };

  const todoCount       = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount       = tasks.filter((t) => t.status === "done").length;

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q) ||
      t.priority?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen relative overflow-hidden pb-12"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.06) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── PAGE HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 40%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.25))",
              }}>
              Kanban Task Workflow
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Organize sprint tasks, track progress across Kanban columns & manage deliverables
            </p>
          </div>

          <div className="flex items-center gap-3">
            {projects.length > 1 && (
              <div className="w-56">
                <CustomDropdown
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                  options={projects.map((p) => ({ value: p._id, label: p.title }))}
                />
              </div>
            )}

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
              <span>Add Task</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI METRICS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SubpageStatCard label="Total Tasks" value={tasks.length} icon={ListTodo} subtext="Across project" color="purple" delay={0} />
          <SubpageStatCard label="To Do Queue" value={todoCount} icon={Filter} subtext="Pending tasks" color="amber" delay={0.05} />
          <SubpageStatCard label="In Progress" value={inProgressCount} icon={Sparkles} subtext="Active execution" color="cyan" delay={0.1} />
          <SubpageStatCard label="Completed" value={doneCount} icon={ListTodo} subtext="Tasks verified done" color="green" delay={0.15} />
        </div>

        {/* ── SEARCH & VIEW TOGGLE TOOLBAR ── */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title, status, or description..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium text-white placeholder-slate-400 outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(99,91,255,0.5)";
                e.target.style.background = "rgba(99,91,255,0.06)";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                e.target.style.background = "rgba(255,255,255,0.04)";
                e.target.style.boxShadow = "none";
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>

          {/* View toggle (Kanban Board vs List Table) */}
          <div className="flex items-center gap-1 p-1 rounded-xl shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[["kanban", LayoutGrid], ["list", List]].map(([v, Icon]) => (
              <motion.button key={v} onClick={() => setView(v)} whileTap={{ scale: 0.92 }}
                title={v === "kanban" ? "Kanban Board View" : "List Table View"}
                className="w-8 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{
                  background: view === v ? "rgba(99,91,255,0.2)" : "transparent",
                  color: view === v ? "#A78BFA" : "#64748B",
                  border: view === v ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                }}>
                <Icon size={14} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT CONTAINER (Client Portal GCard) ── */}
        <GCard delay={0.2} glow="#635BFF" className="min-h-[320px] p-6">
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonColumn key={i} />)}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState onAdd={() => handleAddTask()} />
          ) : view === "kanban" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <KanbanBoard onAddTask={handleAddTask} search={search} />
            </motion.div>
          ) : (
            /* Task List View Table */
            <div className="rounded-2xl overflow-hidden divide-y divide-white/[0.04]"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Table header */}
              <div className="flex items-center gap-4 px-4 py-2.5 bg-white/[0.02]"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Task Title", "Priority", "Status", "Due Date", "Actions"].map((h, i) => (
                  <span key={i} className="text-[10px] font-bold tracking-widest uppercase text-slate-500"
                    style={{
                      flex: h === "Task Title" ? 1 : "none",
                      width: h === "Priority" ? 96 : h === "Status" ? 110 : h === "Due Date" ? 100 : h === "Actions" ? 64 : undefined,
                      textAlign: h === "Actions" ? "right" : "left",
                    }}>
                    {h}
                  </span>
                ))}
              </div>

              <AnimatePresence>
                {filteredTasks.map((t, index) => (
                  <motion.div key={t._id} layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t.title}</p>
                      {t.description && <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.description}</p>}
                    </div>

                    <div className="w-24 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.priority === "urgent" ? "bg-purple-500/15 text-purple-300 border-purple-500/30" :
                        t.priority === "high" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" :
                        t.priority === "medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                        "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      }`}>
                        {t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "Medium"}
                      </span>
                    </div>

                    <div className="w-28 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        t.status === "done" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                        t.status === "in_progress" ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" :
                        t.status === "review" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                        "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          t.status === "done" ? "bg-emerald-400" :
                          t.status === "in_progress" ? "bg-indigo-400" :
                          t.status === "review" ? "bg-amber-400" : "bg-slate-400"
                        }`} />
                        {t.status === "done" ? "Done" : t.status === "in_progress" ? "In Progress" : t.status === "review" ? "In Review" : "To Do"}
                      </span>
                    </div>

                    <div className="w-24 shrink-0 text-xs text-slate-400 font-medium">
                      {t.dueDate ? formatDate(t.dueDate) : "Flexible"}
                    </div>

                    <div className="w-16 shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteTask(t._id)} title="Delete task" className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </GCard>
      </div>

      {/* ── TASK MODAL ── */}
      <TaskModal isOpen={showModal} onClose={() => setShowModal(false)} title="New Task">
        {projects.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">
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
