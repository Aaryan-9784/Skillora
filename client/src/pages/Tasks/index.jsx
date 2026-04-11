import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckSquare, GripVertical } from "lucide-react";
import useProjectStore from "../../store/projectStore";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { formatDate, capitalize } from "../../utils/helpers";

const COLUMNS = [
  { id: "todo",        label: "To Do",       color: "bg-slate-400" },
  { id: "in_progress", label: "In Progress",  color: "bg-brand" },
  { id: "review",      label: "In Review",    color: "bg-warning" },
  { id: "done",        label: "Done",         color: "bg-success" },
];

const TaskCard = ({ task, onStatusChange }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white dark:bg-dark-card rounded-xl border border-surface-border dark:border-dark-border p-3 shadow-xs
               hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group"
  >
    <div className="flex items-start gap-2 mb-2">
      <GripVertical size={13} className="text-ink-muted mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      <p className="text-sm font-medium text-ink dark:text-slate-200 leading-snug flex-1">{task.title}</p>
    </div>
    <div className="flex items-center justify-between mt-3">
      <Badge status={task.priority} />
      <span className="text-xs text-ink-muted">{formatDate(task.dueDate)}</span>
    </div>
    {/* Quick status change */}
    <select
      value={task.status}
      onChange={(e) => onStatusChange(task._id, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 w-full text-xs rounded-md border border-surface-border dark:border-dark-border bg-surface-secondary dark:bg-dark-muted text-ink-secondary px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
    >
      {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
    </select>
  </motion.div>
);

const Tasks = () => {
  const { tasks, projects, fetchProjects, updateTask, isLoading } = useProjectStore();

  useEffect(() => { fetchProjects(); }, []);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-slate-100">Tasks</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Kanban board — {tasks.length} tasks total</p>
        </div>
        <Button size="sm" icon={<Plus size={14} />}>Add Task</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Open a project and add tasks to see them here" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-semibold text-ink dark:text-slate-200">{col.label}</span>
                <span className="ml-auto text-xs font-medium text-ink-muted bg-surface-secondary dark:bg-dark-muted px-2 py-0.5 rounded-full">
                  {tasksByStatus[col.id].length}
                </span>
              </div>

              {/* Cards */}
              <div className="bg-surface-secondary dark:bg-dark-muted rounded-xl p-2 min-h-[200px] space-y-2">
                <AnimatePresence>
                  {tasksByStatus[col.id].map((task) => (
                    <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                </AnimatePresence>
                {tasksByStatus[col.id].length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-ink-muted">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
