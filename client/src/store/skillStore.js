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
    await api.delete(`/skills/${id}`);
    set((s) => ({ skills: s.skills.filter((sk) => sk._id !== id) }));
    toast.success("Skill removed");
  },
}));

export default useSkillStore;
