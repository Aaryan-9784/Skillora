import { create } from "zustand";
import api from "../services/api";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/notifications");
      const list = data?.data?.data || data?.data || [];
      const notifList = Array.isArray(list) ? list : [];
      set({
        notifications: notifList,
        unreadCount: notifList.filter((n) => !n.read).length,
      });
    } catch (err) {
      console.warn("Error fetching notifications:", err.message);
      set({ notifications: [], unreadCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get("/notifications/unread");
      if (data?.data?.count !== undefined) {
        set({ unreadCount: data.data.count });
      } else {
        const { notifications } = get();
        set({ unreadCount: notifications.filter((n) => !n.read).length });
      }
    } catch (err) {
      const { notifications } = get();
      set({ unreadCount: notifications.filter((n) => !n.read).length });
    }
  },

  addNotification: (notification) => {
    set((s) => {
      const exists = s.notifications.some((n) => n._id === notification._id);
      if (exists) return s;
      const list = [notification, ...s.notifications];
      return {
        notifications: list,
        unreadCount: list.filter((n) => !n.read).length,
      };
    });
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
