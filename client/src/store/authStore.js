import { create } from "zustand";
import * as authService from "../services/authService";
import tokenStore from "../services/tokenStore";
import toast from "react-hot-toast";

/**
 * Auth store — access token lives in tokenStore (memory only).
 * User object is kept in Zustand state (not persisted to localStorage
 * to avoid leaking PII — we re-fetch on mount via fetchMe).
 */
const useAuthStore = create((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,  // true on mount until fetchMe resolves
  errors:          {},

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearErrors: () => set({ errors: {} }),

  // ── Register ────────────────────────────────────────────
  register: async (userData) => {
    set({ isLoading: true, errors: {} });
    try {
      const { data } = await authService.register(userData);
      tokenStore.set(data.data.accessToken);
      set({ user: data.data.user, isAuthenticated: true });
      toast.success("Welcome to Skillora!");
      return { success: true };
    } catch (err) {
      const errors = extractErrors(err);
      set({ errors });
      return { success: false, errors };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Login ────────────────────────────────────────────────
  login: async (credentials) => {
    set({ isLoading: true, errors: {} });
    try {
      const { data } = await authService.login(credentials);
      tokenStore.set(data.data.accessToken);
      set({ user: data.data.user, isAuthenticated: true });
      toast.success(`Welcome back, ${data.data.user.name.split(" ")[0]}!`);
      return { success: true };
    } catch (err) {
      const errors = extractErrors(err);
      set({ errors });
      return { success: false, errors };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── OAuth callback (called from OAuthCallback page) ──────
  handleOAuthToken: async (token) => {
    tokenStore.set(token);
    try {
      const { data } = await authService.getMe();
      set({ user: data.data.user, isAuthenticated: true });
      return true;
    } catch {
      tokenStore.clear();
      return false;
    }
  },

  // ── Logout ───────────────────────────────────────────────
  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed even if server call fails
    } finally {
      tokenStore.clear();
      set({ user: null, isAuthenticated: false });
      toast.success("Signed out");
    }
  },

  // ── Logout all devices ───────────────────────────────────
  logoutAll: async () => {
    try {
      await authService.logoutAll();
    } finally {
      tokenStore.clear();
      set({ user: null, isAuthenticated: false });
      toast.success("Signed out from all devices");
    }
  },

  // ── Bootstrap session on app load ────────────────────────
  fetchMe: async () => {
    set({ isLoading: true });
    try {
      // If access token is missing, the interceptor will silently try
      // to refresh via the cookie before this throws. If refresh also
      // fails, the interceptor handles the redirect — we just clean up state.
      const { data } = await authService.getMe();
      tokenStore.set(data.data?.accessToken ?? tokenStore.get()); // keep token in sync
      set({ user: data.data.user, isAuthenticated: true });
    } catch {
      // Interceptor already handles redirect + toast on true expiry.
      // Just reset local state quietly.
      tokenStore.clear();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Forgot password ──────────────────────────────────────
  forgotPassword: async (email) => {
    set({ isLoading: true, errors: {} });
    try {
      await authService.forgotPassword({ email });
      toast.success("Reset link sent if that email exists");
      return { success: true };
    } catch (err) {
      const errors = extractErrors(err);
      set({ errors });
      return { success: false, errors };
    } finally {
      set({ isLoading: false });
    }
  },
}));

// ── Helper: extract validation errors from API response ───
const extractErrors = (err) => {
  const data = err.response?.data;
  if (!data) return { general: "Network error. Please try again." };

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    // Map Joi validation errors to field-level errors
    const fieldErrors = {};
    data.errors.forEach((msg) => {
      const lower = msg.toLowerCase();
      if (lower.includes("email"))    fieldErrors.email    = msg;
      else if (lower.includes("password")) fieldErrors.password = msg;
      else if (lower.includes("name"))     fieldErrors.name     = msg;
      else fieldErrors.general = msg;
    });
    return fieldErrors;
  }

  return { general: data.message || "Something went wrong" };
};

export default useAuthStore;
