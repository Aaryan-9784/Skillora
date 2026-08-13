import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const useProjectStore = create((set, get) => ({
  projects:       [],
  myProposals:   [],
  currentProject: null,
  tasks:          [],
  isLoading:      false,
  error:          null,

  fetchProjects: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/projects", { params });
      set({ projects: data.data.projects || [] });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyProposals: async () => {
    try {
      const { data } = await api.get("/projects/proposals/my");
      const proposals = data.data?.proposals || data.proposals || [];
      set({ myProposals: proposals });
    } catch (err) {
      console.warn("Failed to fetch my proposals:", err);
      set({ myProposals: [] });
    }
  },

  fetchProjectById: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/projects/${id}`);
      set({ currentProject: data.data.project });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (projectData) => {
    const { data } = await api.post("/projects", projectData);
    const project = data.data.project;
    set((s) => ({ projects: [project, ...s.projects] }));
    toast.success("Project created!");
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
    if (!projectId || projectId === "undefined" || typeof projectId !== "string" || projectId.length !== 24) {
      set({ tasks: [] });
      return;
    }
    try {
      const { data } = await api.get(`/projects/${projectId}/tasks`);
      const taskList = data.data?.data || data.data?.tasks || (Array.isArray(data.data) ? data.data : []);
      set({ tasks: taskList });
    } catch (err) {
      console.warn("Failed to fetch tasks for project:", projectId, err);
      set({ tasks: [] });
    }
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
