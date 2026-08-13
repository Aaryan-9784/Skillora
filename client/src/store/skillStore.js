import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const useSkillStore = create((set) => ({
  skills:     [],
  categories: [],
  isLoading:  false,

  fetchSkills: async () => {
    set({ isLoading: true });
    try {
      const [skillsRes, catRes] = await Promise.all([
        api.get("/skills"),
        api.get("/skills/by-category"),
      ]);
      set({
        skills:     skillsRes.data.data.skills || [],
        categories: catRes.data.data.categories || [],
      });
    } catch (err) {
      console.warn("Failed to fetch skills:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  createSkill: async (payload) => {
    const { data } = await api.post("/skills", payload);
    const skill = data.data.skill;
    set((s) => ({ skills: [...s.skills, skill] }));
    toast.success("Skill added");
    return skill;
  },

  updateSkill: async (id, payload) => {
    const { data } = await api.patch(`/skills/${id}`, payload);
    const skill = data.data.skill;
    set((s) => ({ skills: s.skills.map((sk) => (sk._id === id ? skill : sk)) }));
    toast.success("Skill updated");
    return skill;
  },

  deleteSkill: async (id) => {
    try {
      await api.delete(`/skills/${id}`);
      set((s) => ({ skills: s.skills.filter((sk) => sk._id !== id) }));
      toast.success("Skill removed");
    } catch (err) {
      if (err.response?.status === 404) {
        // Skill already removed on server, update state locally
        set((s) => ({ skills: s.skills.filter((sk) => sk._id !== id) }));
        toast.success("Skill removed");
      } else {
        toast.error(err.response?.data?.message || "Failed to delete skill");
      }
    }
  },
}));

export default useSkillStore;
