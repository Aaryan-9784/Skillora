import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const useInvoiceStore = create((set) => ({
  invoices:   [],
  current:    null,
  analytics:  [],
  outstanding: null,
  isLoading:  false,
  pagination: {},

  fetchInvoices: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/invoices", { params });
      const d = data.data;
      set({ invoices: d.data || [], pagination: d.pagination || {} });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInvoice: async (id) => {
    const { data } = await api.get(`/invoices/${id}`);
    set({ current: data.data.invoice });
    return data.data.invoice;
  },

  fetchAnalytics: async () => {
    const [analyticsRes, outstandingRes] = await Promise.all([
      api.get("/invoices/analytics"),
      api.get("/invoices/outstanding"),
    ]);
    set({
      analytics:   analyticsRes.data.data.data,
      outstanding: outstandingRes.data.data.balance,
    });
  },

  createInvoice: async (payload) => {
    const { data } = await api.post("/invoices", payload);
    const invoice = data.data.invoice;
    set((s) => ({ invoices: [invoice, ...s.invoices] }));
    toast.success("Invoice created");
    return invoice;
  },

  updateInvoice: async (id, payload) => {
    const { data } = await api.patch(`/invoices/${id}`, payload);
    const invoice = data.data.invoice;
    set((s) => ({
      invoices: s.invoices.map((i) => (i._id === id ? invoice : i)),
      current:  s.current?._id === id ? invoice : s.current,
    }));
    toast.success("Invoice updated");
    return invoice;
  },

  deleteInvoice: async (id) => {
    await api.delete(`/invoices/${id}`);
    set((s) => ({ invoices: s.invoices.filter((i) => i._id !== id) }));
    toast.success("Invoice deleted");
  },
}));

export default useInvoiceStore;
