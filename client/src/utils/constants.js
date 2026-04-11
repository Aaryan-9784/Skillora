export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];
export const TASK_STATUSES = ["todo", "in_progress", "review", "done"];
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];

export const STATUS_COLORS = {
  planning:  "bg-slate-100 text-slate-600",
  active:    "bg-green-100 text-green-700",
  on_hold:   "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-600",
  todo:       "bg-slate-100 text-slate-600",
  in_progress:"bg-indigo-100 text-indigo-700",
  review:     "bg-purple-100 text-purple-700",
  done:       "bg-green-100 text-green-700",
  low:    "bg-slate-100 text-slate-600",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-600",
};
