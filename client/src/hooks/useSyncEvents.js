import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSocket } from "../services/socketService";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";
import useClientPortalStore from "../store/clientPortalStore";
import useDashboardStore from "../store/dashboardStore";
import useProjectStore from "../store/projectStore";
import useInvoiceStore from "../store/invoiceStore";
import useChatStore from "../store/chatStore";
import useSyncStore from "../store/syncStore";
import tokenStore from "../services/tokenStore";
import useAutoRefresh from "./useAutoRefresh";

const useSyncEvents = () => {
  // Mount silent background polling and tab-visibility revalidation internally
  useAutoRefresh();

  const { updateUser, setUser, user } = useAuthStore();
  const { fetchUnreadCount }          = useNotificationStore();
  const navigate                      = useNavigate();

  const clientStore = useClientPortalStore();
  const chatStore   = useChatStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const isClient = user?.role === "client";

    const onChatMessageNew = ({ message }) => {
      chatStore.appendMessage(message);
    };

    const onChatMessageDeleted = ({ messageId }) => {
      chatStore.markMessageDeleted(messageId);
    };

    const onChatMessageReaction = ({ messageId, reactions }) => {
      chatStore.updateMessageReactions(messageId, reactions);
    };

    const onChatTyping = ({ conversationId, userName }) => {
      chatStore.setTyping(conversationId, userName, true);
    };

    const onChatStopTyping = ({ conversationId }) => {
      chatStore.setTyping(conversationId, "", false);
    };

    const onChatConversationDeleted = ({ conversationId }) => {
      chatStore.removeConversationFromState(conversationId);
      toast("Conversation removed", { icon: "🗑️" });
    };

    const onPresenceSync = ({ onlineUserIds }) => {
      chatStore.setOnlinePresenceBatch(onlineUserIds);
    };

    const onPresenceUpdate = ({ userId, isOnline, lastSeen, clientRef, email }) => {
      chatStore.updatePresence(userId, isOnline, lastSeen, clientRef, email);
    };

    const onSocketConnect = () => {
      socket.emit("presence:query");
      fetchUnreadCount();
      useSyncStore.getState().triggerRefresh(true);
      if (isClient) {
        clientStore.fetchDashboard(true);
      }
    };

    // ── Freelancer / shared events ──────────────────────
    const onNotification = (notification) => {
      useNotificationStore.getState().addNotification(notification);
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
      if (isClient) {
        clientStore.patchInvoice(invoiceId, { status });
      }
      useInvoiceStore.getState().fetchInvoices({}, true);
    };

    const onProjectUpdated = ({ projectId, status, progress }) => {
      window.dispatchEvent(new CustomEvent("project:updated", { detail: { projectId, status, progress } }));
      if (isClient) {
        clientStore.patchProject(projectId, { status, progress });
        clientStore.fetchDashboard(true);
      }
      useProjectStore.getState().fetchProjects({}, true);
      if (projectId && useProjectStore.getState().currentProject?._id === projectId) {
        useProjectStore.getState().fetchProjectById(projectId);
      }
    };

    const onTaskUpdated = ({ projectId, taskId }) => {
      window.dispatchEvent(new CustomEvent("task:updated", { detail: { projectId, taskId } }));
      if (projectId) {
        useProjectStore.getState().fetchTasks(projectId);
      }
      if (isClient) {
        clientStore.fetchDashboard(true);
      }
    };

    const onProposalReceived = (data) => {
      window.dispatchEvent(new CustomEvent("proposal:received", { detail: data }));
      if (isClient) {
        clientStore.fetchDashboard(true);
        if (clientStore.fetchProjects) clientStore.fetchProjects({}, true);
      }
    };

    const onProposalStatus = (data) => {
      window.dispatchEvent(new CustomEvent("proposal:status_changed", { detail: data }));
      useProjectStore.getState().fetchMyProposals();
      useProjectStore.getState().fetchProjects({}, true);
    };

    const onDashboardRefresh = () => {
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      useSyncStore.getState().triggerRefresh(true);
      if (isClient) {
        clientStore.fetchDashboard(true);
      } else {
        useDashboardStore.getState().fetchSummary(true);
      }
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

    // ── Project messages ───────────────────────────────
    const onMessageNew = ({ projectId, message }) => {
      if (isClient) {
        clientStore.appendMessage(projectId, message);
      }
      if (message) {
        chatStore.appendMessage(message);
      }
      window.dispatchEvent(new CustomEvent("message:new", { detail: { projectId, message } }));
    };

    const onMilestoneUpdated = ({ projectId, milestoneId, status }) => {
      if (isClient) {
        clientStore.patchProject(projectId, {}); // trigger re-render
        window.dispatchEvent(new CustomEvent("milestone:updated", { detail: { projectId, milestoneId, status } }));
      }
    };

    socket.on("notification",              onNotification);
    socket.on("invoice:updated",           onInvoiceUpdated);
    socket.on("project:updated",           onProjectUpdated);
    socket.on("task:updated",              onTaskUpdated);
    socket.on("project:proposal_received", onProposalReceived);
    socket.on("project:proposal_status",   onProposalStatus);
    socket.on("dashboard:refresh",         onDashboardRefresh);
    socket.on("user:plan_changed",         onPlanChanged);
    socket.on("auth:force_logout",         onForceLogout);
    socket.on("admin:stats_refresh",       onAdminStatsRefresh);
    socket.on("message:new",               onMessageNew);
    socket.on("milestone:updated",         onMilestoneUpdated);
    socket.on("chat:message_new",          onChatMessageNew);
    socket.on("chat:message_deleted",      onChatMessageDeleted);
    socket.on("chat:conversation_deleted", onChatConversationDeleted);
    socket.on("chat:message_reaction",     onChatMessageReaction);
    socket.on("chat:typing",               onChatTyping);
    socket.on("chat:stop_typing",          onChatStopTyping);
    socket.on("presence:update",           onPresenceUpdate);
    socket.on("presence:sync",             onPresenceSync);
    socket.on("connect",                   onSocketConnect);

    if (socket.connected) {
      socket.emit("presence:query");
    }

    return () => {
      socket.off("notification",              onNotification);
      socket.off("invoice:updated",           onInvoiceUpdated);
      socket.off("project:updated",           onProjectUpdated);
      socket.off("task:updated",              onTaskUpdated);
      socket.off("project:proposal_received", onProposalReceived);
      socket.off("project:proposal_status",   onProposalStatus);
      socket.off("dashboard:refresh",         onDashboardRefresh);
      socket.off("user:plan_changed",         onPlanChanged);
      socket.off("auth:force_logout",         onForceLogout);
      socket.off("admin:stats_refresh",       onAdminStatsRefresh);
      socket.off("message:new",               onMessageNew);
      socket.off("milestone:updated",         onMilestoneUpdated);
      socket.off("chat:message_new",          onChatMessageNew);
      socket.off("chat:message_deleted",      onChatMessageDeleted);
      socket.off("chat:conversation_deleted", onChatConversationDeleted);
      socket.off("chat:message_reaction",     onChatMessageReaction);
      socket.off("chat:typing",               onChatTyping);
      socket.off("chat:stop_typing",          onChatStopTyping);
      socket.off("presence:update",           onPresenceUpdate);
      socket.off("presence:sync",             onPresenceSync);
      socket.off("connect",                   onSocketConnect);
    };
  }, [user?.role]);
};

export default useSyncEvents;
