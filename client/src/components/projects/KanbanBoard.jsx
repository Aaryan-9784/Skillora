import { useState, useCallback } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Trash2, Calendar } from "lucide-react";
import useProjectStore from "../../store/projectStore";
import Badge from "../ui/Badge";
import api from "../../services/api";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const COLUMNS = [
  { id: "todo",        label: "To Do",       color: "bg-slate-400",  ring: "ring-slate-200 dark:ring-slate-700" },
  { id: "in_progress", label: "In Progress",  color: "bg-brand",      ring: "ring-brand/20" },
  { id: "review",      label: "In Review",    color: "bg-warning",    ring: "ring-amber-200 dark:ring-amber-800" },
  { id: "done",        label: "Done",         color: "bg-success",    ring: "ring-emerald-200 dark:ring-emerald-800" },
];

// ── Sortable task card ────────────────────────────────────
const TaskCard = ({ task, isDragging = false, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white dark:bg-dark-card rounded-xl border border-surface-border dark:border-dark-border p-3
                  shadow-xs group select-none ${isDragging ? "shadow-xl rotate-1 scale-105" : "hover:shadow-md hover:-translate-y-0.5"}
                  transition-all duration-150`}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners}
          className="mt-0.5 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical size={13} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink dark:text-slate-200 leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-ink-muted mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between mt-2.5">
            <Badge status={task.priority} />
            {task.dueDate && (
              <span className="flex items-center gap-1 text-2xs text-ink-muted">
                <Calendar size={10} />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          {task.assignedTo && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand/20 flex items-center justify-center text-2xs font-bold text-brand">
                {task.assignedTo.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-2xs text-ink-muted">{task.assignedTo.name}</span>
            </div>
          )}
        </div>
        <button onClick={() => onDelete(task._id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-error transition-all shrink-0">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

// ── Droppable column ──────────────────────────────────────
const Column = ({ column, tasks, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col gap-3 min-w-[240px] flex-1">
      <div className="flex items-center gap-2 px-1">
        <span className={`w-2 h-2 rounded-full ${column.color}`} />
        <span className="text-sm font-semibold text-ink dark:text-slate-200">{column.label}</span>
        <span className="ml-auto text-xs font-medium text-ink-muted bg-surface-secondary dark:bg-dark-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-[300px] space-y-2 transition-colors duration-150
                    ${isOver ? `ring-2 ${column.ring} bg-brand-50/50 dark:bg-brand/5` : "bg-surface-secondary dark:bg-dark-muted"}`}>
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div key={task._id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <TaskCard task={task} onDelete={onDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && (
          <div className={`flex items-center justify-center h-20 text-xs text-ink-muted rounded-lg border-2 border-dashed transition-colors
                          ${isOver ? "border-brand/40 text-brand" : "border-surface-border dark:border-dark-border"}`}>
            {isOver ? "Drop here" : "No tasks"}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main board ────────────────────────────────────────────
const KanbanBoard = ({ projectId }) => {
  const { tasks, updateTask, deleteTask, reorderTasks } = useProjectStore();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasksByColumn = useCallback(() =>
    COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id).sort((a, b) => a.order - b.order);
      return acc;
    }, {}),
  [tasks]);

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t._id === active.id) || null);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    // Dropped over a column
    const overColumn = COLUMNS.find((c) => c.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      reorderTasks(tasks.map((t) => t._id === activeTask._id ? { ...t, status: overColumn.id } : t));
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    // Determine target status
    const overColumn = COLUMNS.find((c) => c.id === over.id);
    const overTask   = tasks.find((t) => t._id === over.id);
    const newStatus  = overColumn?.id || overTask?.status || activeTask.status;

    // Reorder within column
    const colTasks = tasks.filter((t) => t.status === newStatus);
    const oldIndex = colTasks.findIndex((t) => t._id === active.id);
    const newIndex = colTasks.findIndex((t) => t._id === over.id);

    let newTasks = [...tasks];
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(colTasks, oldIndex, newIndex);
      newTasks = tasks.map((t) => {
        const r = reordered.find((rt) => rt._id === t._id);
        return r ? { ...r, order: reordered.indexOf(r) } : t;
      });
    }

    // Apply status change
    newTasks = newTasks.map((t) => t._id === activeTask._id ? { ...t, status: newStatus } : t);
    reorderTasks(newTasks);

    // Persist
    try {
      if (newStatus !== activeTask.status) {
        await updateTask(activeTask._id, { status: newStatus });
      }
      // Persist order via bulk reorder endpoint
      const orderedIds = newTasks.filter((t) => t.status === newStatus)
        .sort((a, b) => a.order - b.order).map((t) => t._id);
      await api.post(`/projects/${projectId}/tasks/reorder`, { orderedIds });
    } catch {
      toast.error("Failed to save task order");
    }
  };

  const cols = tasksByColumn();

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column key={col.id} column={col} tasks={cols[col.id] || []} onDelete={deleteTask} />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging onDelete={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
