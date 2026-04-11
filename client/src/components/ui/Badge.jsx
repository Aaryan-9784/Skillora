import { capitalize } from "../../utils/helpers";

const STATUS_MAP = {
  // Project statuses
  planning:   "badge-neutral",
  active:     "badge-success",
  on_hold:    "badge-warning",
  completed:  "badge-info",
  cancelled:  "badge-error",
  // Task statuses
  todo:        "badge-neutral",
  in_progress: "badge-brand",
  review:      "badge-warning",
  done:        "badge-success",
  // Priorities
  low:    "badge-neutral",
  medium: "badge-info",
  high:   "badge-warning",
  urgent: "badge-error",
  // Invoice
  draft:   "badge-neutral",
  sent:    "badge-info",
  paid:    "badge-success",
  overdue: "badge-error",
};

const DOT_COLORS = {
  active: "bg-success", planning: "bg-slate-400", on_hold: "bg-warning",
  completed: "bg-info", cancelled: "bg-error", todo: "bg-slate-400",
  in_progress: "bg-brand", review: "bg-warning", done: "bg-success",
};

const Badge = ({ status, dot = false, className = "" }) => (
  <span className={`${STATUS_MAP[status] || "badge-neutral"} ${className}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status] || "bg-slate-400"}`} />}
    {capitalize(status)}
  </span>
);

export default Badge;
