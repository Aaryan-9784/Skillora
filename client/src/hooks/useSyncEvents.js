import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSocket } from "../services/socketService";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";
import tokenStore from "../services/tokenStore";

const useSyncEvents = () => {
  const { updateUser, setUser } = useAuthStore();
  const { fetchUnreadCount }    = useNotificationStore();
  const navigate                = useNavigate();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNotification = (notification) => {
      fetchUnreadCount();
      toast(notification.title, {
        icon: "🔔",
        style: { background: "#111827", color: "#F1F5F9", border: "1px solid #1E2A3B" },
      });
    };

    const onInvoiceUpdated = ({ invoiceId, status }) => {
      window.dispatchEvent(new CustomEvent("invoice:updated", { detail: { invoiceId, status } }));
    };

    const onProjectUpdated = ({ projectId, status, progress }) => {
      window.dispatchEvent(new CustomEvent("project:updated", { detail: { projectId, status, progress } }));
    };

    const onDashboardRefresh = () => {
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
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

    socket.on("notification",        onNotification);
    socket.on("invoice:updated",     onInvoiceUpdated);
    socket.on("project:updated",     onProjectUpdated);
    socket.on("dashboard:refresh",   onDashboardRefresh);
    socket.on("user:plan_changed",   onPlanChanged);
    socket.on("auth:force_logout",   onForceLogout);
    socket.on("admin:stats_refresh", onAdminStatsRefresh);

    return () => {
      socket.off("notification",        onNotification);
      socket.off("invoice:updated",     onInvoiceUpdated);
      socket.off("project:updated",     onProjectUpdated);
      socket.off("dashboard:refresh",   onDashboardRefresh);
      socket.off("user:plan_changed",   onPlanChanged);
      socket.off("auth:force_logout",   onForceLogout);
      socket.off("admin:stats_refresh", onAdminStatsRefresh);
    };
  }, []);
};

export default useSyncEvents;
