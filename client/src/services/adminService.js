import api from "./api";

export const getStats           = ()              => api.get("/admin/stats");
export const getUsers           = (params = {})   => api.get("/admin/users", { params });
export const updateUser         = (id, data)      => api.patch(`/admin/users/${id}`, data);
export const deleteUser         = (id)            => api.delete(`/admin/users/${id}`);
export const getRevenue         = (months = 12)   => api.get(`/admin/revenue?months=${months}`);
export const getRevenueSummary  = ()              => api.get("/admin/revenue/summary");
export const getPlatformConfig  = ()              => api.get("/admin/config");
export const updatePlatformConfig = (data)        => api.patch("/admin/config", data);
export const getActivityLog     = (params = {})   => api.get("/admin/activity", { params });
