import { create } from "zustand";
import * as svc from "../services/clientPortalService";
import toast from "react-hot-toast";

const useClientPortalStore = create((set, get) => ({
  // ── Core data ─────────────────────────────────────────
  invoices:         [],
  projects:         [],
  profile:          null,
  financeSummary:   null,
  notifications:    [],
  unreadCount:      0,
  activity:         [],
  activityPagination: { total: 0, page: 1, pages: 1 },
  tasksByProject:   {},
  messagesByProject: {},
  messagePagination: {},
  revenueAnalytics: [],   // ← was missing, caused the crash
  aiInsights:       null, // ← was missing

  // ── Loading flags ─────────────────────────────────────
  loading: {
    dashboard: false, invoices: false, projects: false,
    profile: false, notifications: false, finance: false,
    activity: false, tasks: {}, messages: {}, payment: false,
    analytics: false, aiInsights: false,
  },
  error: {
    dashboard: null, invoices: null, projects: null,
    profile: null, notifications: null,
  },

  _setLoading: (key, val) =>
    set((s) => ({ loading: { ...s.loading, [key]: val } })),
  _setError: (key, val) =>
    set((s) => ({ error: { ...s.error, [key]: val } })),

  // ── Dashboard (parallel fetch) ────────────────────────
  fetchDashboard: async () => {
    get()._setLoading("dashboard", true);
    get()._setError("dashboard", null);
    try {
      const [invRes, projRes, finRes] = await Promise.all([
        svc.getInvoices(),
        svc.getProjects(),
        svc.getFinanceSummary(),
      ]);
      set({
        invoices:       invRes.data.data.invoices  || [],
        projects:       projRes.data.data.projects || [],
        financeSummary: finRes.data.data,
      });
    } catch (e) {
      get()._setError("dashboard", e.message);
    } finally {
      get()._setLoading("dashboard", false);
    }
  },

  // ── Finance summary ───────────────────────────────────
  fetchFinanceSummary: async () => {
    get()._setLoading("finance", true);
    try {
      const { data } = await svc.getFinanceSummary();
      set({ financeSummary: data.data });
    } finally {
      get()._setLoading("finance", false);
    }
  },

  // ── Revenue analytics (for chart) ────────────────────
  fetchAnalytics: async () => {
    get()._setLoading("analytics", true);
    try {
      const { data } = await svc.getRevenueAnalytics();
      set({ revenueAnalytics: data.data?.data || data.data || [] });
    } catch {
      set({ revenueAnalytics: [] });
    } finally {
      get()._setLoading("analytics", false);
    }
  },

  // ── AI Insights ───────────────────────────────────────
  fetchAiInsights: async () => {
    get()._setLoading("aiInsights", true);
    try {
      const { data } = await svc.getAiInsights();
      set({ aiInsights: data.data?.insights || data.data || null });
    } catch {
      set({ aiInsights: null });
    } finally {
      get()._setLoading("aiInsights", false);
    }
  },

  // ── Invoices ──────────────────────────────────────────
  fetchInvoices: async (params = {}) => {
    get()._setLoading("invoices", true);
    get()._setError("invoices", null);
    try {
      const { data } = await svc.getInvoices(params);
      set({ invoices: data.data.invoices || [] });
    } catch (e) {
      get()._setError("invoices", e.message);
    } finally {
      get()._setLoading("invoices", false);
    }
  },

  // ── Projects ──────────────────────────────────────────
  fetchProjects: async (params = {}) => {
    get()._setLoading("projects", true);
    get()._setError("projects", null);
    try {
      const { data } = await svc.getProjects(params);
      set({ projects: data.data.projects || [] });
    } catch (e) {
      get()._setError("projects", e.message);
    } finally {
      get()._setLoading("projects", false);
    }
  },

  // ── Profile ───────────────────────────────────────────
  fetchProfile: async () => {
    get()._setLoading("profile", true);
    get()._setError("profile", null);
    try {
      const { data } = await svc.getProfile();
      set({ profile: data.data.client });
    } catch (e) {
      get()._setError("profile", e.message);
    } finally {
      get()._setLoading("profile", false);
    }
  },

  updateProfile: async (form) => {
    get()._setLoading("profile", true);
    try {
      const { data } = await svc.updateProfile(form);
      set({ profile: data.data.client });
      toast.success("Profile updated");
      return true;
    } catch {
      toast.error("Failed to update profile");
      return false;
    } finally {
      get()._setLoading("profile", false);
    }
  },

  // ── Tasks per project ─────────────────────────────────
  fetchTasks: async (projectId) => {
    set((s) => ({ loading: { ...s.loading, tasks: { ...s.loading.tasks, [projectId]: true } } }));
    try {
      const { data } = await svc.getProjectTasks(projectId);
      set((s) => ({
        tasksByProject: { ...s.tasksByProject, [projectId]: data.data.data || [] },
      }));
    } catch { /* silent */ }
    finally {
      set((s) => ({ loading: { ...s.loading, tasks: { ...s.loading.tasks, [projectId]: false } } }));
    }
  },

  // ── Messages ──────────────────────────────────────────
  fetchMessages: async (projectId, page = 1) => {
    set((s) => ({ loading: { ...s.loading, messages: { ...s.loading.messages, [projectId]: true } } }));
    try {
      const { data } = await svc.getMessages(projectId, page);
      const msgs = data.data.data || [];
      set((s) => ({
        messagesByProject: {
          ...s.messagesByProject,
          [projectId]: page === 1 ? msgs : [...msgs, ...(s.messagesByProject[projectId] || [])],
        },
        messagePagination: { ...s.messagePagination, [projectId]: data.data.pagination },
      }));
    } catch { /* silent */ }
    finally {
      set((s) => ({ loading: { ...s.loading, messages: { ...s.loading.messages, [projectId]: false } } }));
    }
  },

  sendMessage: async (projectId, content) => {
    try {
      const { data } = await svc.sendMessage(projectId, content);
      const msg = data.data.message;
      set((s) => ({
        messagesByProject: {
          ...s.messagesByProject,
          [projectId]: [...(s.messagesByProject[projectId] || []), msg],
        },
      }));
      return msg;
    } catch {
      toast.error("Failed to send message");
      return null;
    }
  },

  appendMessage: (projectId, message) =>
    set((s) => ({
      messagesByProject: {
        ...s.messagesByProject,
        [projectId]: [...(s.messagesByProject[projectId] || []), message],
      },
    })),

  // ── Activity ──────────────────────────────────────────
  fetchActivity: async (page = 1) => {
    get()._setLoading("activity", true);
    try {
      const { data } = await svc.getActivity(page);
      const items = data.data.data || [];
      set((s) => ({
        activity: page === 1 ? items : [...s.activity, ...items],
        activityPagination: data.data.pagination,
      }));
    } finally {
      get()._setLoading("activity", false);
    }
  },

  // ── Notifications ─────────────────────────────────────
  fetchNotifications: async () => {
    get()._setLoading("notifications", true);
    try {
      const { data } = await svc.getNotifications();
      const list = data.data.data || [];
      set({
        notifications: list,
        unreadCount:   list.filter((n) => !n.read).length,
      });
    } finally {
      get()._setLoading("notifications", false);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await svc.getUnreadCount();
      set({ unreadCount: data.data.count });
    } catch { /* silent */ }
  },

  markNotificationRead: async (id) => {
    await svc.markNotifRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) => n._id === id ? { ...n, read: true } : n),
      unreadCount:   Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllNotificationsRead: async () => {
    await svc.markAllNotifsRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount:   0,
    }));
  },

  addNotification: (notif) =>
    set((s) => ({
      notifications: [notif, ...s.notifications],
      unreadCount:   s.unreadCount + 1,
    })),

  // ── Payment ───────────────────────────────────────────
  initiatePayment: async (invoiceId, userInfo) => {
    get()._setLoading("payment", true);
    try {
      const { data } = await svc.initiatePayment(invoiceId);
      const { orderId, amount, currency, keyId, invoiceNumber, freelancerName } = data.data;

      return new Promise((resolve, reject) => {
        const options = {
          key:         keyId,
          order_id:    orderId,
          amount,
          currency,
          name:        "Skillora",
          description: `Invoice ${invoiceNumber}`,
          prefill:     { name: userInfo?.name, email: userInfo?.email },
          theme:       { color: "#635BFF" },
          handler: async (response) => {
            try {
              const verifyRes = await svc.verifyPayment(invoiceId, response);
              const invoice   = verifyRes.data.data.invoice;
              // Optimistic update
              set((s) => ({
                invoices: s.invoices.map((i) => i._id === invoiceId ? { ...i, status: "paid", paidAt: invoice.paidAt } : i),
                financeSummary: s.financeSummary ? {
                  ...s.financeSummary,
                  totalPaid:    (s.financeSummary.totalPaid || 0) + invoice.total,
                  totalPending: Math.max(0, (s.financeSummary.totalPending || 0) - invoice.total),
                } : s.financeSummary,
              }));
              toast.success("Payment successful!");
              resolve(invoice);
            } catch (err) {
              toast.error("Payment verification failed");
              reject(err);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        };

        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src   = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload  = () => new window.Razorpay(options).open();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        } else {
          new window.Razorpay(options).open();
        }
      });
    } catch (err) {
      if (err.message !== "Payment cancelled") toast.error(err.response?.data?.message || "Payment failed");
      throw err;
    } finally {
      get()._setLoading("payment", false);
    }
  },

  // ── Milestone actions ─────────────────────────────────
  approveMilestone: async (projectId, milestoneId) => {
    try {
      await svc.approveMilestone(projectId, milestoneId);
      set((s) => ({
        projects: s.projects.map((p) => {
          if (p._id !== projectId) return p;
          return {
            ...p,
            milestones: (p.milestones || []).map((m) =>
              m._id === milestoneId ? { ...m, status: "approved" } : m
            ),
          };
        }),
      }));
      toast.success("Milestone approved");
    } catch {
      toast.error("Failed to approve milestone");
    }
  },

  requestChanges: async (projectId, milestoneId, feedback) => {
    try {
      await svc.requestChanges(projectId, milestoneId, feedback);
      set((s) => ({
        projects: s.projects.map((p) => {
          if (p._id !== projectId) return p;
          return {
            ...p,
            milestones: (p.milestones || []).map((m) =>
              m._id === milestoneId ? { ...m, status: "changes_requested", feedback } : m
            ),
          };
        }),
      }));
      toast.success("Changes requested");
    } catch {
      toast.error("Failed to request changes");
    }
  },

  // ── Real-time patch helpers ───────────────────────────
  patchInvoice: (id, updates) =>
    set((s) => ({ invoices: s.invoices.map((i) => i._id === id ? { ...i, ...updates } : i) })),

  patchProject: (id, updates) =>
    set((s) => ({ projects: s.projects.map((p) => p._id === id ? { ...p, ...updates } : p) })),

  patchTask: (projectId, taskId, updates) =>
    set((s) => ({
      tasksByProject: {
        ...s.tasksByProject,
        [projectId]: (s.tasksByProject[projectId] || []).map((t) =>
          t._id === taskId ? { ...t, ...updates } : t
        ),
      },
    })),
}));

export default useClientPortalStore;
