import { create } from "zustand";
import api from "../services/api";

const useBillingStore = create((set) => ({
  info:      null,
  isLoading: false,

  fetchInfo: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/billing");
      set({ info: data.data });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useBillingStore;
