import { create } from "zustand";
import { persist } from "zustand/middleware";

const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: true,
      toggle: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle("dark", next);
      },
      init: () => {
        const { isDark } = get();
        document.documentElement.classList.toggle("dark", isDark !== false);
      },
    }),
    { name: "skillora-theme" }
  )
);

export default useThemeStore;
