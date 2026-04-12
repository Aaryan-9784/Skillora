import axios from "axios";
import toast from "react-hot-toast";
import tokenStore from "./tokenStore";

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout:         15000,
});

// ── Request: attach in-memory access token ────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: silent token refresh on 401 ────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// Prevent duplicate "session expired" redirects/toasts
let sessionExpiredHandled = false;

const handleSessionExpired = () => {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  tokenStore.clear();
  // Fixed ID ensures only one toast ever shows, no matter how many
  // concurrent requests fail at the same time
  toast.error("Session expired. Please sign in again.", { id: "session-expired" });

  setTimeout(() => {
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }, 300);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status   = error.response?.status;

    // ── Silent refresh on 401 ──────────────────────────────
    if (
      status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/register")
    ) {
      if (isRefreshing) {
        // Queue this request — resolve once refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const { data } = await api.post("/auth/refresh");
        const newToken = data.data?.accessToken;

        if (newToken) {
          tokenStore.set(newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return api(original);
        }

        // Refresh succeeded but no token returned — treat as expired
        throw new Error("No token in refresh response");
      } catch {
        processQueue(new Error("Session expired"), null);
        handleSessionExpired();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Show toast for non-auth errors only ───────────────
    if (status !== 401 && status !== 403) {
      const message = error.response?.data?.message || "Something went wrong";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
