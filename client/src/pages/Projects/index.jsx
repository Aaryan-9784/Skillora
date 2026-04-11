import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderKanban, Search, LayoutGrid, List, Trash2, Pencil } from "lucide-react";
import useProjectStore from "../../store/projectStore";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { formatDate, formatCurrency } from "../../utils/helpers";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ProjectForm = ({ onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({ title: "", description: "", budget: "", deadline: "", status: "planning" });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input label="Project title *" name="title" placeholder="e.g. Brand Redesign" value={form.title} onChange={set} required />
      <div>
        <label className="label">Description</label>
        <textarea name="description" className="input resize-none h-20" placeholder="What's this project about?" value={form.description} onChange={set} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Budget (USD)" name="budget" type="number" min="0" placeholder="0" value={form.budget} onChange={set} prefix="$" />
        <Input label="Deadline" name="deadline" type="date" value={form.deadline} onChange={set} />
      </div>
      <Select label="Status" name="status" value={form.status} onChange={set} options={STATUS_OPTIONS.slice(1)} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>Create Project</Button>
      </div>
    </form>
  );
};

const Projects = () => {
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("grid");

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (data) => {
    setCreating(true);
    await createProject(data);
    setCreating(false);
    setShowModal(false);
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-slate-100">Projects</h1>
          <p className="text-sm text-ink-secondary mt-0.5">{projects.length} total</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>New Project</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-8" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
        <div className="flex items-center gap-1 ml-auto bg-surface-secondary dark:bg-dark-muted rounded-lg p-1">
          {[["grid", LayoutGrid], ["list", List]].map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)}
              className={`p-1.5 rounded-md transition-colors ${view === v ? "bg-white dark:bg-dark-card shadow-xs text-brand" : "text-ink-muted hover:text-ink"}`}>
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={search ? "Try a different search term" : "Create your first project to get started"}
          action={!search ? () => setShowModal(true) : undefined}
          actionLabel="New Project"
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04 }}
                className="card-hover group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/projects/${p._id}`} className="font-semibold text-ink dark:text-slate-100 hover:text-brand transition-colors line-clamp-1 flex-1">
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button className="p-1 rounded-md hover:bg-surface-secondary dark:hover:bg-dark-muted text-ink-muted hover:text-brand transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteProject(p._id)}
                      className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-error transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-ink-secondary line-clamp-2 mb-4 min-h-[40px]">
                  {p.description || "No description provided"}
                </p>
                <div className="flex items-center justify-between">
                  <Badge status={p.status} dot />
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink dark:text-slate-200">{formatCurrency(p.budget, p.currency)}</p>
                    <p className="text-xs text-ink-muted">{formatDate(p.deadline)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card divide-y divide-surface-border dark:divide-dark-border">
          {filtered.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg table-row-hover group">
              <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand/10 flex items-center justify-center shrink-0">
                <FolderKanban size={14} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/projects/${p._id}`} className="text-sm font-medium text-ink dark:text-slate-200 hover:text-brand transition-colors truncate block">
                  {p.title}
                </Link>
                <p className="text-xs text-ink-muted truncate">{p.description || "—"}</p>
              </div>
              <Badge status={p.status} dot className="hidden sm:inline-flex" />
              <span className="text-sm text-ink-secondary hidden md:block">{formatCurrency(p.budget, p.currency)}</span>
              <span className="text-xs text-ink-muted hidden lg:block">{formatDate(p.deadline)}</span>
              <button onClick={() => deleteProject(p._id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-error transition-all">
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project" description="Fill in the details to create a new project">
        <ProjectForm onSubmit={handleCreate} onClose={() => setShowModal(false)} loading={creating} />
      </Modal>
    </div>
  );
};

export default Projects;
