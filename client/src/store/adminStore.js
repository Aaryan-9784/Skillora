import { create } from "zustand";
import * as adminService from "../services/adminService";
import toast from "react-hot-toast";

const useAdminStore = create((set) => ({
  stats:    null,
  users:    [],
  total:    0,
  revenue:  [],
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await adminService.getStats();
      set({ stats: data.data.stats });
    } finally {
      set({ isLoading: false });
    }
  },

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
      set((s) => ({
        users: s.users.map((u) => u._id === id ? data.data.user : u),
      }));
      toast.success("User updated");
      return true;
    } catch {
      return false;
    }
  },

  deleteUser: async (id) => {
    try {
      await adminService.deleteUser(id);
      set((s) => ({ users: s.users.filter((u) => u._id !== id) }));
      toast.success("User deleted");
      return true;
    } catch {
      return false;
    }
  },

  fetchRevenue: async (months = 12) => {
    const { data } = await adminService.getRevenue(months);
    set({ revenue: data.data.data });
  },
}));

export default useAdminStore;
