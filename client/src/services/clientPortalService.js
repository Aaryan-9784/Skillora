import api from "./api";

export const clientLogin      = (data) => api.post("/client/login", data);
export const acceptInvite     = (data) => api.post("/client/accept-invite", data);
export const getMe            = ()     => api.get("/client/me");
export const getInvoices      = ()     => api.get("/client/invoices");
export const getProjects      = ()     => api.get("/client/projects");
export const getProfile       = ()     => api.get("/client/profile");
export const updateProfile    = (data) => api.patch("/client/profile", data);
export const getInvoiceDetail = (id)   => api.get(`/client/invoices/${id}`);
