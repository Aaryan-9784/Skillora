import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const useInvoiceStore = create((set, get) => ({
  invoices:    [],
  current:     null,
  analytics:   [],   // [{year,month,revenue,invoiceCount}]
  outstanding: null, // {outstanding,count,overdue}
  isLoading:   false,
  pagination:  { total: 0, page: 1, pages: 1, limit: 20 },
  filters:     { status: "", search: "", dateFrom: "", dateTo: "", sort: "-createdAt" },

  // ── Filters ───────────────────────────────────────────
  setFilters: (updates) =>
    set((s) => ({ filters: { ...s.filters, ...updates } })),

  resetFilters: () =>
    set({ filters: { status: "", search: "", dateFrom: "", dateTo: "", sort: "-createdAt" } }),

  // ── Fetch list ────────────────────────────────────────
  fetchInvoices: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const query = { ...filters, ...params };
      Object.keys(query).forEach((k) => { if (query[k] === "") delete query[k]; });
      const { data } = await api.get("/invoices", { params: query });
      const d = data.data;
      set({
        invoices:   d.data       || [],
        pagination: d.pagination || { total: 0, page: 1, pages: 1, limit: 20 },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Fetch single ──────────────────────────────────────
  fetchInvoice: async (id) => {
    const { data } = await api.get(`/invoices/${id}`);
    set({ current: data.data.invoice });
    return data.data.invoice;
  },

  // ── Analytics ─────────────────────────────────────────
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

  // ── CRUD ──────────────────────────────────────────────
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
    set((s) => ({
      invoices: s.invoices.filter((i) => i._id !== id),
      current:  s.current?._id === id ? null : s.current,
    }));
    toast.success("Invoice deleted");
  },

  // ── Status transitions ────────────────────────────────
  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/invoices/${id}/status`, { status });
    const invoice  = data.data.invoice;
    set((s) => ({
      invoices: s.invoices.map((i) => i._id === id ? invoice : i),
      current:  s.current?._id === id ? invoice : s.current,
    }));
    toast.success(`Invoice marked as ${status}`);
    return invoice;
  },

  sendInvoice: async (id) => {
    const { data } = await api.post(`/invoices/${id}/send`);
    const invoice  = data.data.invoice;
    set((s) => ({
      invoices: s.invoices.map((i) => i._id === id ? invoice : i),
      current:  s.current?._id === id ? invoice : s.current,
    }));
    toast.success("Invoice sent to client");
    return invoice;
  },

  duplicateInvoice: async (id) => {
    const { data } = await api.post(`/invoices/${id}/duplicate`);
    const invoice  = data.data.invoice;
    set((s) => ({ invoices: [invoice, ...s.invoices] }));
    toast.success("Invoice duplicated as draft");
    return invoice;
  },

  // ── Real-time patch (socket events) ──────────────────
  patchInvoice: (id, updates) =>
    set((s) => ({
      invoices: s.invoices.map((i) => i._id === id ? { ...i, ...updates } : i),
      current:  s.current?._id === id ? { ...s.current, ...updates } : s.current,
    })),
}));

export default useInvoiceStore;
