import { create } from "zustand";
import * as authService from "../services/authService";
import tokenStore from "../services/tokenStore";
import toast from "react-hot-toast";

import useAiStore from "./aiStore";

/**
 * Auth store — access token lives in tokenStore (memory only).
 * User object is kept in Zustand state (not persisted to localStorage
 * to avoid leaking PII — we re-fetch on mount via fetchMe).
 */
const useAuthStore = create((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,  // ← TRUE: block route guards until session restore completes
  errors:          {},

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    useAiStore.getState().syncUserSession(user?._id || null);
  },

  clearErrors: () => set({ errors: {} }),

  // ── Register ────────────────────────────────────────────
  register: async (userData) => {
    set({ isLoading: true, errors: {} });
    try {
      const { data } = await authService.register(userData);
      tokenStore.set(data.data.accessToken);
      sessionStorage.setItem("sk_has_session", "1");
      set({ user: data.data.user, isAuthenticated: true });
      useAiStore.getState().syncUserSession(data.data.user._id);
      toast.success("Welcome to Skillora!");
      return { success: true, role: data.data.user.role };
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
      if (data.data?.require2FA) {
        return { require2FA: true, mfaToken: data.data.mfaToken };
      }
      tokenStore.set(data.data.accessToken);
      sessionStorage.setItem("sk_has_session", "1");
      set({ user: data.data.user, isAuthenticated: true });
      useAiStore.getState().syncUserSession(data.data.user._id);
      toast.success(`Welcome back, ${data.data.user.name.split(" ")[0]}!`);
      return { success: true, role: data.data.user.role };
    } catch (err) {
      const errors = extractErrors(err);
      set({ errors });
      return { success: false, errors };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── 2FA verification & setup ────────────────────────────
  verify2FALogin: async (mfaToken, code) => {
    set({ isLoading: true, errors: {} });
    try {
      const { data } = await authService.verify2FALogin(mfaToken, code);
      tokenStore.set(data.data.accessToken);
      sessionStorage.setItem("sk_has_session", "1");
      set({ user: data.data.user, isAuthenticated: true });
      useAiStore.getState().syncUserSession(data.data.user._id);
      toast.success(`Welcome back, ${data.data.user.name.split(" ")[0]}!`);
      return { success: true, role: data.data.user.role };
    } catch (err) {
      const errors = extractErrors(err);
      set({ errors });
      return { success: false, errors };
    } finally {
      set({ isLoading: false });
    }
  },

  setup2FA: async () => {
    try {
      const { data } = await authService.setup2FA();
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate 2FA setup");
      throw err;
    }
  },

  enable2FA: async (token) => {
    try {
      const { data } = await authService.enable2FA(token);
      set((s) => ({ user: s.user ? { ...s.user, isTwoFactorEnabled: true } : s.user }));
      toast.success("2FA enabled successfully!");
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enable 2FA");
      throw err;
    }
  },

  disable2FA: async (token) => {
    try {
      await authService.disable2FA(token);
      set((s) => ({ user: s.user ? { ...s.user, isTwoFactorEnabled: false } : s.user }));
      toast.success("2FA disabled successfully");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to disable 2FA");
      throw err;
    }
  },

  // ── OAuth callback (called from OAuthCallback page) ──────
  handleOAuthToken: async (token) => {
    tokenStore.set(token);
    sessionStorage.setItem("sk_has_session", "1");
    try {
      const { data } = await authService.getMe();
      set({ user: data.data.user, isAuthenticated: true });
      useAiStore.getState().syncUserSession(data.data.user._id);
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
      sessionStorage.removeItem("sk_has_session");
      set({ user: null, isAuthenticated: false });
      useAiStore.getState().syncUserSession(null);
      toast.success("Signed out");
    }
  },

  // ── Logout all devices ───────────────────────────────────
  logoutAll: async () => {
    try {
      await authService.logoutAll();
    } finally {
      tokenStore.clear();
      sessionStorage.removeItem("sk_has_session");
      set({ user: null, isAuthenticated: false });
      useAiStore.getState().syncUserSession(null);
      toast.success("Signed out from all devices");
    }
  },

  // ── Bootstrap session on app load ────────────────────────
  fetchMe: async () => {
    // Skip fetch entirely if no session marker — avoids hanging on cold load
    if (!sessionStorage.getItem("sk_has_session") && !tokenStore.get()) {
      set({ isLoading: false });
      useAiStore.getState().syncUserSession(null);
      return;
    }
    set({ isLoading: true });
    // Hard safety timeout — never hang the app more than 3s
    const timeout = setTimeout(() => {
      set({ isLoading: false });
    }, 3000);
    try {
      const { data } = await authService.getMe();
      tokenStore.set(data.data?.accessToken ?? tokenStore.get());
      sessionStorage.setItem("sk_has_session", "1");
      set({ user: data.data.user, isAuthenticated: true });
      useAiStore.getState().syncUserSession(data.data.user._id);
    } catch {
      tokenStore.clear();
      sessionStorage.removeItem("sk_has_session");
      set({ user: null, isAuthenticated: false });
      useAiStore.getState().syncUserSession(null);
    } finally {
      clearTimeout(timeout);
      set({ isLoading: false });
    }
  },

  // ── Update user (partial merge) ─────────────────────────
  updateUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : s.user })),

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
