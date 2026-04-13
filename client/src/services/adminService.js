import api from "./api";

export const getStats   = ()            => api.get("/admin/stats");
export const getUsers   = (params = {}) => api.get("/admin/users", { params });
export const updateUser = (id, data)    => api.patch(`/admin/users/${id}`, data);
export const deleteUser = (id)          => api.delete(`/admin/users/${id}`);
export const getRevenue = (months = 12) => api.get(`/admin/revenue?months=${months}`);
