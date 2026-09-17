import { create } from "zustand";
import api from "../services/api";

const useDashboardStore = create((set) => ({
  summary:   null,
  isLoading: false,
  error:     null,

  fetchSummary: async (silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/dashboard");
      set({ summary: data, error: null });
    } catch (err) {
      console.warn("[dashboardStore] Failed to fetch summary:", err.message);
      if (!silent) set({ error: err.message || "Failed to load dashboard" });
    } finally {
      if (!silent) set({ isLoading: false });
    }
  },
}));

export default useDashboardStore;
