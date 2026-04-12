import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import useNotificationStore from "../../store/notificationStore";
import { formatDate } from "../../utils/helpers";

const TYPE_META = {
  project_created:   { emoji: "🗂️", color: "#635BFF" },
  project_completed: { emoji: "✅", color: "#22C55E" },
  task_assigned:     { emoji: "📋", color: "#3B82F6" },
  task_due_soon:     { emoji: "⏰", color: "#F59E0B" },
  invoice_sent:      { emoji: "📄", color: "#8B5CF6" },
  invoice_paid:      { emoji: "💰", color: "#22C55E" },
  payment_received:  { emoji: "💳", color: "#00D4FF" },
  ai_suggestion:     { emoji: "🤖", color: "#A78BFA" },
  system:            { emoji: "🔔", color: "#6B7280" },
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
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-40 w-[340px] rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, rgba(12,19,36,0.99) 0%, rgba(8,14,26,0.99) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 0 0 1px rgba(99,91,255,0.1), 0 24px 56px rgba(0,0,0,0.7), 0 0 40px rgba(99,91,255,0.06)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.2)" }}>
                  <Bell size={13} style={{ color: "#A78BFA" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.5)" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{ color: "#A78BFA", background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(99,91,255,0.1)"}
                    title="Mark all read"
                  >
                    <CheckCheck size={12} />
                    All read
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#E5E7EB"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[340px] overflow-y-auto"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(99,91,255,0.2) transparent" }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.12)" }}>
                    <Bell size={24} style={{ color: "rgba(99,91,255,0.4)" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: "#6B7280" }}>All caught up!</p>
                    <p className="text-xs mt-0.5" style={{ color: "#374151" }}>No new notifications</p>
                  </div>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const meta = TYPE_META[n.type] || TYPE_META.system;
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group flex items-start gap-3 px-4 py-3 relative transition-all duration-150"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: !n.read ? "rgba(99,91,255,0.04)" : "transparent",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = !n.read ? "rgba(99,91,255,0.04)" : "transparent"}
                    >
                      {!n.read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full"
                          style={{ background: "linear-gradient(180deg,#635BFF,#8B5CF6)" }} />
                      )}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm mt-0.5"
                        style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug" style={{ color: "#E5E7EB" }}>{n.title}</p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#6B7280" }}>{n.message}</p>
                        <p className="text-[10px] mt-1" style={{ color: "#374151" }}>{formatDate(n.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!n.read && (
                          <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => markRead(n._id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
                            style={{ color: "#6B7280" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.15)"; e.currentTarget.style.color = "#A78BFA"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
                          >
                            <Check size={11} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => deleteNotification(n._id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
                          style={{ color: "#6B7280" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#EF4444"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
                        >
                          <Trash2 size={11} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
