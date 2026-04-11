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
import { GripVertical, Trash2, Calendar, Plus } from "lucide-react";
import useProjectStore from "../../store/projectStore";
import api from "../../services/api";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────
// COLUMN CONFIG
// ─────────────────────────────────────────────────────────
const COLUMNS = [
  { id: "todo",        label: "To Do",       dot: "#9CA3AF", glow: "rgba(156,163,175,0.15)", ring: "rgba(156,163,175,0.3)" },
  { id: "in_progress", label: "In Progress",  dot: "#635BFF", glow: "rgba(99,91,255,0.15)",  ring: "rgba(99,91,255,0.4)"   },
  { id: "review",      label: "In Review",    dot: "#F59E0B", glow: "rgba(245,158,11,0.15)", ring: "rgba(245,158,11,0.4)"  },
  { id: "done",        label: "Done",         dot: "#22C55E", glow: "rgba(34,197,94,0.15)",  ring: "rgba(34,197,94,0.4)"   },
];

const PRIORITY_STYLE = {
  low:    { color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", label: "Low"    },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  label: "Medium" },
  high:   { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   label: "High"   },
  urgent: { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  label: "Urgent" },
};

// ─────────────────────────────────────────────────────────
// PRIORITY BADGE
// ─────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE.medium;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>
      {s.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// TASK CARD (sortable)
// ─────────────────────────────────────────────────────────
const TaskCard = ({ task, isDragging = false, onDelete }) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging
          ? "rgba(99,91,255,0.15)"
          : "rgba(255,255,255,0.04)",
        border: isDragging
          ? "1px solid rgba(99,91,255,0.5)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isDragging
          ? "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,91,255,0.3)"
          : undefined,
        transform: isDragging
          ? `${CSS.Transform.toString(transform)} rotate(2deg) scale(1.04)`
          : CSS.Transform.toString(transform),
        borderRadius: 14,
        padding: "12px",
        backdropFilter: "blur(12px)",
        cursor: "grab",
      }}
      className="group select-none transition-shadow duration-150"
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.border = "1px solid rgba(99,91,255,0.3)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,91,255,0.15)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "";
        }
      }}
    >
      {/* Drag handle + title row */}
      <div className="flex items-start gap-2">
        <button
          {...attributes} {...listeners}
          className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          style={{ color: "#4B5563" }}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: "#F9FAFB" }}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: "#6B7280" }}>
              {task.description}
            </p>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
          className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "#4B5563" }}>
            <Calendar size={9} />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Assignee */}
      {task.assignedTo && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)" }}>
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-[10px]" style={{ color: "#4B5563" }}>{task.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// DROPPABLE COLUMN
// ─────────────────────────────────────────────────────────
const Column = ({ column, tasks, onDelete, onAddTask }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 min-w-[260px] flex-1"
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-1">
        <span className="w-2 h-2 rounded-full shrink-0"
          style={{ background: column.dot, boxShadow: `0 0 8px ${column.dot}` }} />
        <span className="text-sm font-semibold" style={{ color: "#E5E7EB" }}>{column.label}</span>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${column.dot}18`, color: column.dot, border: `1px solid ${column.dot}30` }}>
          {tasks.length}
        </span>
        <button
          onClick={() => onAddTask(column.id)}
          className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
          style={{ color: "#4B5563" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.15)"; e.currentTarget.style.color = "#A78BFA"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}
          title={`Add to ${column.label}`}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 rounded-2xl p-2.5 min-h-[320px] space-y-2.5 transition-all duration-200"
        style={{
          background: isOver
            ? `${column.glow}`
            : "rgba(255,255,255,0.02)",
          border: isOver
            ? `1px solid ${column.ring}`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: isOver
            ? `0 0 0 2px ${column.ring}, inset 0 0 20px ${column.glow}`
            : "none",
        }}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div key={task._id} layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2 }}>
                <TaskCard task={task} onDelete={onDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty drop zone */}
        {tasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-24 rounded-xl transition-all duration-200"
            style={{
              border: `2px dashed ${isOver ? column.ring : "rgba(255,255,255,0.06)"}`,
              color: isOver ? column.dot : "#374151",
            }}
          >
            <span className="text-xs font-medium">{isOver ? "Drop here" : "No tasks"}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN KANBAN BOARD
// ─────────────────────────────────────────────────────────
const KanbanBoard = ({ projectId, onAddTask }) => {
  const { tasks, updateTask, deleteTask, reorderTasks } = useProjectStore();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const tasksByColumn = useCallback(() =>
    COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return acc;
    }, {}),
  [tasks]);

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t._id === active.id) || null);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const dragged = tasks.find((t) => t._id === active.id);
    if (!dragged) return;
    const overCol = COLUMNS.find((c) => c.id === over.id);
    if (overCol && dragged.status !== overCol.id) {
      reorderTasks(tasks.map((t) => t._id === dragged._id ? { ...t, status: overCol.id } : t));
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const dragged = tasks.find((t) => t._id === active.id);
    if (!dragged) return;

    const overCol  = COLUMNS.find((c) => c.id === over.id);
    const overTask = tasks.find((t) => t._id === over.id);
    const newStatus = overCol?.id || overTask?.status || dragged.status;

    const colTasks = tasks.filter((t) => t.status === newStatus);
    const oldIdx   = colTasks.findIndex((t) => t._id === active.id);
    const newIdx   = colTasks.findIndex((t) => t._id === over.id);

    let newTasks = [...tasks];
    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      const reordered = arrayMove(colTasks, oldIdx, newIdx);
      newTasks = tasks.map((t) => {
        const r = reordered.find((rt) => rt._id === t._id);
        return r ? { ...r, order: reordered.indexOf(r) } : t;
      });
    }
    newTasks = newTasks.map((t) => t._id === dragged._id ? { ...t, status: newStatus } : t);
    reorderTasks(newTasks);

    try {
      if (newStatus !== dragged.status) await updateTask(dragged._id, { status: newStatus });
      const orderedIds = newTasks.filter((t) => t.status === newStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((t) => t._id);
      if (projectId) await api.post(`/projects/${projectId}/tasks/reorder`, { orderedIds });
    } catch {
      toast.error("Failed to save task order");
    }
  };

  const cols = tasksByColumn();

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
        {COLUMNS.map((col) => (
          <Column key={col.id} column={col} tasks={cols[col.id] || []}
            onDelete={deleteTask} onAddTask={onAddTask} />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
        {activeTask && <TaskCard task={activeTask} isDragging onDelete={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
