import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const useClientStore = create((set) => ({
  clients:    [],
  current:    null,
  isLoading:  false,
  pagination: { total: 0, page: 1, pages: 1 },

  fetchClients: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/clients", { params });
      const d = data.data;
      set({ clients: d.data || [], pagination: d.pagination || {} });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchClient: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/clients/${id}`);
      set({ current: data.data });
      return data.data;
    } finally {
      set({ isLoading: false });
    }
  },

  createClient: async (payload) => {
    const { data } = await api.post("/clients", payload);
    const client = data.data.client;
    set((s) => ({ clients: [client, ...s.clients] }));
    toast.success("Client added");
    return client;
  },

  updateClient: async (id, payload) => {
    const { data } = await api.patch(`/clients/${id}`, payload);
    const client = data.data.client;
    set((s) => ({
      clients: s.clients.map((c) => (c._id === id ? client : c)),
      current: s.current?.client?._id === id ? { ...s.current, client } : s.current,
    }));
    toast.success("Client updated");
    return client;
  },

  deleteClient: async (id) => {
    await api.delete(`/clients/${id}`);
    set((s) => ({ clients: s.clients.filter((c) => c._id !== id) }));
    toast.success("Client deleted");
  },
}));

export default useClientStore;
