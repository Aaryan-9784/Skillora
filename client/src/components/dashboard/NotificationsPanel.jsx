import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import useNotificationStore from "../../store/notificationStore";
import { formatDate } from "../../utils/helpers";

const TYPE_ICONS = {
  project_created:   "🗂️",
  project_completed: "✅",
  task_assigned:     "📋",
  task_due_soon:     "⏰",
  invoice_sent:      "📄",
  invoice_paid:      "💰",
  payment_received:  "💳",
  ai_suggestion:     "🤖",
  system:            "🔔",
};

const NotificationsPanel = ({ open, onClose }) => {
  const { notifications, unreadCount, fetchNotifications, markRead, markAllRead, deleteNotification } =
    useNotificationStore();

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-40 w-80 card-glass shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-dark-border">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-ink-secondary" />
                <span className="text-sm font-semibold text-ink dark:text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <span className="badge-brand text-2xs">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="p-1.5 rounded-lg text-ink-muted hover:text-brand hover:bg-brand-50 dark:hover:bg-brand/10 transition-colors"
                    title="Mark all read">
                    <CheckCheck size={14} />
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary dark:hover:bg-dark-muted transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell size={28} className="mx-auto text-ink-muted opacity-30 mb-2" />
                  <p className="text-sm text-ink-secondary">All caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-surface-border dark:border-dark-border last:border-0 group
                                ${!n.read ? "bg-brand-50/50 dark:bg-brand/5" : ""}`}>
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-slate-200 leading-snug">{n.title}</p>
                      <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-2xs text-ink-muted mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.read && (
                        <button onClick={() => markRead(n._id)}
                          className="p-1 rounded-md hover:bg-brand-50 dark:hover:bg-brand/10 text-ink-muted hover:text-brand transition-colors">
                          <Check size={12} />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(n._id)}
                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-error transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
