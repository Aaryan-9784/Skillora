import api from "./api";

export const register      = (data)  => api.post("/auth/register", data);
export const login         = (data)  => api.post("/auth/login", data);
export const logout        = ()      => api.post("/auth/logout");
export const logoutAll     = ()      => api.post("/auth/logout-all");
export const getMe         = ()      => api.get("/auth/me");
export const refreshToken  = ()      => api.post("/auth/refresh", {}, { validateStatus: (s) => s < 500 });
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const setup2FA        = ()      => api.post("/auth/2fa/setup");
export const enable2FA       = (token) => api.post("/auth/2fa/enable", { token });
export const disable2FA      = (token) => api.post("/auth/2fa/disable", { token });
export const verify2FALogin  = (mfaToken, code) => api.post("/auth/2fa/verify-login", { mfaToken, code });
