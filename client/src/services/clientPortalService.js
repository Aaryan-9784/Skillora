import api from "./api";

// ── Auth ──────────────────────────────────────────────────
export const clientLogin      = (data) => api.post("/client/login", data);
export const acceptInvite     = (data) => api.post("/client/accept-invite", data);
export const getMe            = ()     => api.get("/client/me");

// ── Profile ───────────────────────────────────────────────
export const getProfile       = ()     => api.get("/client/profile");
export const updateProfile    = (data) => api.patch("/client/profile", data);

// ── Finance ───────────────────────────────────────────────
export const getFinanceSummary   = ()    => api.get("/client/finance-summary");
export const getRevenueAnalytics = ()    => api.get("/client/revenue-analytics");
export const getAiInsights       = ()    => api.get("/client/ai-insights");

// ── Invoices ──────────────────────────────────────────────
export const getInvoices      = (params = {}) => api.get("/client/invoices", { params });
export const getInvoiceDetail = (id)           => api.get(`/client/invoices/${id}`);
export const initiatePayment  = (id)           => api.post(`/client/invoices/${id}/pay`);
export const verifyPayment    = (id, data)     => api.post(`/client/invoices/${id}/pay/verify`, data);

// ── Projects ──────────────────────────────────────────────
export const getProjects      = (params = {}) => api.get("/client/projects", { params });
export const approveMilestone = (projectId, milestoneId)          => api.post(`/client/projects/${projectId}/milestones/${milestoneId}/approve`);
export const requestChanges   = (projectId, milestoneId, feedback) => api.post(`/client/projects/${projectId}/milestones/${milestoneId}/request-changes`, { feedback });

// ── Project tasks (read-only via freelancer API) ──────────
export const getProjectTasks  = (projectId) => api.get(`/projects/${projectId}/tasks`);

// ── Messages ──────────────────────────────────────────────
export const getMessages      = (projectId, page = 1) => api.get(`/client/messages/${projectId}`, { params: { page } });
export const sendMessage      = (projectId, content)  => api.post(`/client/messages/${projectId}`, { content });

// ── Activity ──────────────────────────────────────────────
export const getActivity      = (page = 1) => api.get("/client/activity", { params: { page, limit: 20 } });

// ── Notifications ─────────────────────────────────────────
export const getNotifications      = (page = 1) => api.get("/client/notifications", { params: { page } });
export const getUnreadCount        = ()          => api.get("/client/notifications/unread-count");
export const markNotifRead         = (id)        => api.patch(`/client/notifications/${id}/read`);
export const markAllNotifsRead     = ()          => api.patch("/client/notifications/read-all");
