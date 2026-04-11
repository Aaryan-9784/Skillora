import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const useProjectStore = create((set, get) => ({
  projects:       [],
  currentProject: null,
  tasks:          [],
  isLoading:      false,
  pagination:     { total: 0, page: 1, pages: 1 },

  fetchProjects: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/projects", { params });
      const d = data.data;
      set({
        projects:   d.data || [],
        pagination: d.pagination || { total: 0, page: 1, pages: 1 },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/projects/${id}`);
      set({ currentProject: data.data.project });
      return data.data.project;
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (projectData) => {
    const { data } = await api.post("/projects", projectData);
    const project = data.data.project;
    set((s) => ({ projects: [project, ...s.projects] }));
    toast.success("Project created");
    return project;
  },

  updateProject: async (id, updates) => {
    const { data } = await api.patch(`/projects/${id}`, updates);
    const project = data.data.project;
    set((s) => ({
      projects:       s.projects.map((p) => (p._id === id ? project : p)),
      currentProject: s.currentProject?._id === id ? project : s.currentProject,
    }));
    toast.success("Project updated");
    return project;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((s) => ({ projects: s.projects.filter((p) => p._id !== id) }));
    toast.success("Project deleted");
  },

  // Tasks
  fetchTasks: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/tasks`);
    set({ tasks: data.data.data || [] });
  },

  createTask: async (taskData) => {
    const { data } = await api.post("/projects/tasks", taskData);
    const task = data.data.task;
    set((s) => ({ tasks: [...s.tasks, task] }));
    toast.success("Task created");
    return task;
  },

  updateTask: async (id, updates) => {
    const { data } = await api.patch(`/projects/tasks/${id}`, updates);
    const task = data.data.task;
    set((s) => ({ tasks: s.tasks.map((t) => (t._id === id ? task : t)) }));
    return task;
  },

  reorderTasks: (newTasks) => set({ tasks: newTasks }),

  deleteTask: async (id) => {
    await api.delete(`/projects/tasks/${id}`);
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }));
    toast.success("Task deleted");
  },
}));

export default useProjectStore;
