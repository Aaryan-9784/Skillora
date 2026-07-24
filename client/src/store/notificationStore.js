import { create } from "zustand";
import api from "../services/api";

const DEMO_NOTIFICATIONS = [
  {
    _id: "notif-1",
    type: "project_created",
    title: "New Project Assigned",
    message: "You were assigned to 'Skillora AI Platform'. Check out the milestone overview.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    _id: "notif-2",
    type: "payment_received",
    title: "Invoice #INV-2026-004 Paid",
    message: "Client Acme Corp paid ₹45,000 via Stripe.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    _id: "notif-3",
    type: "task_due_soon",
    title: "Task Milestone Due",
    message: "'Design System Tokens' is due tomorrow at 5:00 PM.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
];

const useNotificationStore = create((set, get) => ({
  notifications: DEMO_NOTIFICATIONS,
  unreadCount: DEMO_NOTIFICATIONS.filter((n) => !n.read).length,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/notifications");
      const list = data?.data?.data || data?.data || [];
      if (list.length > 0) {
        set({
          notifications: list,
          unreadCount: list.filter((n) => !n.read).length,
        });
      }
    } catch (err) {
      console.warn("Using local notification fallback:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get("/notifications/unread");
      if (data?.data?.count !== undefined) {
        set({ unreadCount: data.data.count });
      }
    } catch (err) {
      const { notifications } = get();
      set({ unreadCount: notifications.filter((n) => !n.read).length });
    }
  },

  markRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      /* ignore */
    }
    set((s) => {
      const updated = s.notifications.map((n) => (n._id === id ? { ...n, read: true } : n));
      return {
        notifications: updated,
        unreadCount: Math.max(0, updated.filter((n) => !n.read).length),
      };
    });
  },

  markAllRead: async () => {
    try {
      await api.patch("/notifications/read-all");
    } catch (e) {
      /* ignore */
    }
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (e) {
      /* ignore */
    }
    set((s) => {
      const updated = s.notifications.filter((n) => n._id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },
}));

export default useNotificationStore;
