import { create } from "zustand";
import api from "../services/api";

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount:   0,
  isLoading:     false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/notifications");
      set({ notifications: data.data.data || [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const { data } = await api.get("/notifications/unread");
    set({ unreadCount: data.data.count });
  },

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((s) => ({
      notifications: s.notifications.map((n) => n._id === id ? { ...n, read: true } : n),
      unreadCount:   Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await api.patch("/notifications/read-all");
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount:   0,
    }));
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    set((s) => ({ notifications: s.notifications.filter((n) => n._id !== id) }));
  },
}));

export default useNotificationStore;
