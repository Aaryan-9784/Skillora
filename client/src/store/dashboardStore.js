import { create } from "zustand";
import api from "../services/api";

const useDashboardStore = create((set) => ({
  summary:   null,
  isLoading: false,
  error:     null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/dashboard");
      set({ summary: data, error: null });
    } catch (err) {
      console.warn("[dashboardStore] Failed to fetch summary:", err.message);
      set({ error: err.message || "Failed to load dashboard" });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useDashboardStore;
