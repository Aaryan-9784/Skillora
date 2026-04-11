import axios from "axios";
import toast from "react-hot-toast";
import tokenStore from "./tokenStore";

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // always send cookies (refresh token)
  timeout:         15000,
});

// ── Request: attach in-memory access token ────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: silent token refresh on 401 ────────────────
let isRefreshing  = false;
let failedQueue   = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        // Queue concurrent requests while refresh is in flight
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
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStore.clear();
        // Only redirect if we're not already on an auth page
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?session=expired";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show toast for non-auth errors
    const message = error.response?.data?.message || "Something went wrong";
    const status  = error.response?.status;

    if (status !== 401 && status !== 403) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
