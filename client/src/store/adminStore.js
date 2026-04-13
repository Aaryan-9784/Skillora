import { create } from "zustand";
import * as adminService from "../services/adminService";
import toast from "react-hot-toast";

const useAdminStore = create((set, get) => ({
  // ── state ──────────────────────────────────────────────
  stats:          null,
  users:          [],
  total:          0,
  revenue:        [],
  revenueSummary: null,
  config:         null,
  activity:       [],
  isLoading:      false,

  // ── stats ──────────────────────────────────────────────
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await adminService.getStats();
      const s = data.data.stats;
      set({
        stats: {
          totalUsers:  s.users?.total   ?? 0,
          newUsers:    s.users?.new     ?? 0,
          activeToday: s.users?.active  ?? 0,
          paidUsers:   (s.plans?.pro ?? 0) + (s.plans?.premium ?? 0),
          mrr:         s.revenue?.total ?? 0,
          adminCount:  s.adminCount     ?? 0,
          totalProjects: s.projects?.total ?? 0,
          aiRequests:  s.ai?.requestsLast30Days ?? 0,
          plans:       s.plans ?? {},
          raw:         s,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── users ──────────────────────────────────────────────
  fetchUsers: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await adminService.getUsers(params);
      set({ users: data.data.users, total: data.data.total });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (id, updates) => {
    try {
      const { data } = await adminService.updateUser(id, updates);
      set((s) => ({ users: s.users.map((u) => u._id === id ? data.data.user : u) }));
      toast.success("User updated");
      return true;
    } catch {
      toast.error("Failed to update user");
      return false;
    }
  },

  deleteUser: async (id) => {
    try {
      await adminService.deleteUser(id);
      set((s) => ({ users: s.users.filter((u) => u._id !== id), total: s.total - 1 }));
      toast.success("User deleted");
      return true;
    } catch {
      toast.error("Failed to delete user");
      return false;
    }
  },

  // ── revenue ────────────────────────────────────────────
  fetchRevenue: async (months = 12) => {
    set({ isLoading: true });
    try {
      const { data } = await adminService.getRevenue(months);
      set({ revenue: data.data.data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRevenueSummary: async () => {
    try {
      const { data } = await adminService.getRevenueSummary();
      set({ revenueSummary: data.data.data });
    } catch { /* silent */ }
  },

  // ── config ─────────────────────────────────────────────
  fetchConfig: async () => {
    try {
      const { data } = await adminService.getPlatformConfig();
      set({ config: data.data.config });
    } catch { /* silent */ }
  },

  saveConfig: async (updates) => {
    try {
      const { data } = await adminService.updatePlatformConfig(updates);
      set({ config: data.data.config });
      toast.success("Settings saved");
      return true;
    } catch {
      toast.error("Failed to save settings");
      return false;
    }
  },

  // ── activity ───────────────────────────────────────────
  fetchActivity: async (params) => {
    try {
      const { data } = await adminService.getActivityLog(params);
      set({ activity: data.data.events });
    } catch { /* silent */ }
  },
}));

export default useAdminStore;
