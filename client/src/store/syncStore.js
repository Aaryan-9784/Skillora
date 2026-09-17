import { create } from "zustand";
import useNotificationStore from "./notificationStore";
import useDashboardStore from "./dashboardStore";
import useProjectStore from "./projectStore";
import useInvoiceStore from "./invoiceStore";
import useClientPortalStore from "./clientPortalStore";
import useAuthStore from "./authStore";

const MIN_REFRESH_INTERVAL_MS = 4000; // Minimum 4s cooldown between auto refreshes

const useSyncStore = create((set, get) => ({
  lastRefreshedAt: Date.now(),
  isRefreshing: false,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,

  setOnline: (isOnline) => set({ isOnline }),

  triggerRefresh: async (force = false, pathname = window.location.pathname) => {
    const { isRefreshing, lastRefreshedAt } = get();
    const now = Date.now();

    if (!force && (isRefreshing || now - lastRefreshedAt < MIN_REFRESH_INTERVAL_MS)) {
      return;
    }

    set({ isRefreshing: true });

    try {
      const user = useAuthStore.getState().user;
      const isClient = user?.role === "client" || pathname.startsWith("/client");
      const isAdmin = user?.role === "admin" || pathname.startsWith("/admin");

      const tasks = [];

      // 1. Notification unread count (all roles)
      tasks.push(
        useNotificationStore.getState().fetchUnreadCount().catch((err) => {
          console.debug("[syncStore] fetchUnreadCount failed:", err);
        })
      );

      // 2. Role-specific and route-specific data fetching
      if (isClient) {
        const clientStore = useClientPortalStore.getState();
        tasks.push(clientStore.fetchDashboard().catch(() => {}));
        if (pathname.includes("/projects") && clientStore.fetchProjects) {
          tasks.push(clientStore.fetchProjects().catch(() => {}));
        }
        if (pathname.includes("/invoices") && clientStore.fetchInvoices) {
          tasks.push(clientStore.fetchInvoices().catch(() => {}));
        }
      } else if (isAdmin) {
        window.dispatchEvent(new CustomEvent("admin:stats_refresh"));
      } else {
        // Freelancer
        const dashStore = useDashboardStore.getState();
        const projStore = useProjectStore.getState();
        const invStore = useInvoiceStore.getState();

        if (pathname === "/dashboard" || pathname === "/") {
          tasks.push(dashStore.fetchSummary().catch(() => {}));
        }

        if (pathname.startsWith("/projects") || pathname.startsWith("/marketplace")) {
          tasks.push(projStore.fetchProjects().catch(() => {}));
          tasks.push(projStore.fetchMyProposals().catch(() => {}));
        }

        if (pathname.startsWith("/payments") || pathname.startsWith("/invoices")) {
          tasks.push(invStore.fetchInvoices().catch(() => {}));
        }
      }

      await Promise.allSettled(tasks);

      window.dispatchEvent(new CustomEvent("app:sync_complete", { detail: { timestamp: Date.now() } }));
    } catch (err) {
      console.warn("[syncStore] Refresh error:", err);
    } finally {
      set({ isRefreshing: false, lastRefreshedAt: Date.now() });
    }
  },
}));

export default useSyncStore;
