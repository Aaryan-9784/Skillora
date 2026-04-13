import api from "./api";

export const register      = (data)  => api.post("/auth/register", data);
export const login         = (data)  => api.post("/auth/login", data);
export const logout        = ()      => api.post("/auth/logout");
export const logoutAll     = ()      => api.post("/auth/logout-all");
export const getMe         = ()      => api.get("/auth/me");
export const refreshToken  = ()      => api.post("/auth/refresh", {}, { validateStatus: (s) => s < 500 });
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword  = (token, data) => api.post(`/auth/reset-password/${token}`, data);
