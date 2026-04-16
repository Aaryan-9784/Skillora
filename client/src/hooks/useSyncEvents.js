import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSocket } from "../services/socketService";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";
import useClientPortalStore from "../store/clientPortalStore";
import tokenStore from "../services/tokenStore";

const useSyncEvents = () => {
  const { updateUser, setUser, user } = useAuthStore();
  const { fetchUnreadCount }          = useNotificationStore();
  const navigate                      = useNavigate();

  // Client portal store — only accessed when user is a client
  const clientStore = useClientPortalStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const isClient = user?.role === "client";

    // ── Freelancer / shared events ──────────────────────
    const onNotification = (notification) => {
      fetchUnreadCount();
      if (isClient) {
        clientStore.addNotification(notification);
        clientStore.fetchUnreadCount();
      }
      toast(notification.title, {
        icon: "🔔",
        style: { background: "#111827", color: "#F1F5F9", border: "1px solid #1E2A3B" },
      });
    };

    const onInvoiceUpdated = ({ invoiceId, status }) => {
      window.dispatchEvent(new CustomEvent("invoice:updated", { detail: { invoiceId, status } }));
      if (isClient) clientStore.patchInvoice(invoiceId, { status });
    };

    const onProjectUpdated = ({ projectId, status, progress }) => {
      window.dispatchEvent(new CustomEvent("project:updated", { detail: { projectId, status, progress } }));
      if (isClient) clientStore.patchProject(projectId, { status, progress });
    };

    const onDashboardRefresh = () => {
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      if (isClient) clientStore.fetchDashboard();
    };

    const onPlanChanged = ({ plan }) => {
      updateUser({ plan });
      toast.success(`Your plan has been updated to ${plan}.`);
    };

    const onForceLogout = ({ reason }) => {
      tokenStore.clear();
      setUser(null);
      toast.error(reason || "Your session has been terminated.");
      navigate("/login", { replace: true });
    };

    const onAdminStatsRefresh = () => {
      window.dispatchEvent(new CustomEvent("admin:stats_refresh"));
    };

    // ── Client-only events ──────────────────────────────
    const onMessageNew = ({ projectId, message }) => {
      if (isClient) {
        clientStore.appendMessage(projectId, message);
        window.dispatchEvent(new CustomEvent("message:new", { detail: { projectId, message } }));
      }
    };

    const onMilestoneUpdated = ({ projectId, milestoneId, status }) => {
      if (isClient) {
        clientStore.patchProject(projectId, {}); // trigger re-render
        window.dispatchEvent(new CustomEvent("milestone:updated", { detail: { projectId, milestoneId, status } }));
      }
    };

    socket.on("notification",        onNotification);
    socket.on("invoice:updated",     onInvoiceUpdated);
    socket.on("project:updated",     onProjectUpdated);
    socket.on("dashboard:refresh",   onDashboardRefresh);
    socket.on("user:plan_changed",   onPlanChanged);
    socket.on("auth:force_logout",   onForceLogout);
    socket.on("admin:stats_refresh", onAdminStatsRefresh);
    socket.on("message:new",         onMessageNew);
    socket.on("milestone:updated",   onMilestoneUpdated);

    return () => {
      socket.off("notification",        onNotification);
      socket.off("invoice:updated",     onInvoiceUpdated);
      socket.off("project:updated",     onProjectUpdated);
      socket.off("dashboard:refresh",   onDashboardRefresh);
      socket.off("user:plan_changed",   onPlanChanged);
      socket.off("auth:force_logout",   onForceLogout);
      socket.off("admin:stats_refresh", onAdminStatsRefresh);
      socket.off("message:new",         onMessageNew);
      socket.off("milestone:updated",   onMilestoneUpdated);
    };
  }, [user?.role]);
};

export default useSyncEvents;
