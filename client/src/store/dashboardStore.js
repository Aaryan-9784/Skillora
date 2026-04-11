import { create } from "zustand";
import api from "../services/api";

const useDashboardStore = create((set) => ({
  summary:   null,
  isLoading: false,

  fetchSummary: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/dashboard");
      set({ summary: data });   // data is the full ApiResponse body
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useDashboardStore;
