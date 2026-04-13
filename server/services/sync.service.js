const Notification = require("../models/Notification");
const { emitToUser, emitNotification, getIO } = require("../config/socket");
const logger = require("../utils/logger");

/**
 * Core helper — creates a DB notification AND emits it via Socket.io.
 */
const notify = async ({ recipientId, type, title, message, link = "", refModel = null, refId = null, emitOnly = false }) => {
  try {
    if (!emitOnly && recipientId) {
      const notification = await Notification.create({
        recipient: recipientId,
        type, title, message, link, refModel, refId,
      });
      emitNotification(recipientId, notification);
      return notification;
    } else if (recipientId) {
      emitToUser(recipientId, "sync", { type, title, message, link, refModel, refId });
    }
  } catch (err) {
    logger.error(`sync.service notify error: ${err.message}`);
  }
};

// ── Invoice Events ────────────────────────────────────────

const onInvoiceSent = async (invoice, freelancerId) => {
  const User = require("../models/User");
  const clientUser = await User.findOne({ clientRef: invoice.clientId, role: "client" });

  if (clientUser) {
    await notify({
      recipientId: clientUser._id,
      type:    "invoice_sent",
      title:   "New invoice received",
      message: `Invoice #${invoice.invoiceNumber} for ${invoice.currency} ${invoice.total?.toLocaleString()} is ready.`,
      link:    `/client/invoices/${invoice._id}`,
      refModel: "Invoice",
      refId:    invoice._id,
    });
  }

  emitToUser(freelancerId, "invoice:updated", { invoiceId: invoice._id, status: invoice.status });
};

const onInvoiceViewed = async (invoice) => {
  await notify({
    recipientId: invoice.owner,
    type:    "invoice_viewed",
    title:   "Invoice viewed",
    message: `Your invoice #${invoice.invoiceNumber} was viewed by the client.`,
    link:    `/payments`,
    refModel: "Invoice",
    refId:    invoice._id,
  });

  emitToUser(invoice.owner, "invoice:updated", { invoiceId: invoice._id, status: "viewed" });
};

const onInvoicePaid = async (invoice, freelancerId) => {
  const User = require("../models/User");
  const clientUser = await User.findOne({ clientRef: invoice.clientId, role: "client" });

  if (clientUser) {
    await notify({
      recipientId: clientUser._id,
      type:    "invoice_paid",
      title:   "Payment confirmed",
      message: `Invoice #${invoice.invoiceNumber} has been marked as paid. Thank you!`,
      link:    `/client/invoices/${invoice._id}`,
      refModel: "Invoice",
      refId:    invoice._id,
    });
  }

  emitToUser(freelancerId, "dashboard:refresh", { reason: "invoice_paid" });

  const io = getIO();
  if (io) io.to("role:admin").emit("admin:stats_refresh", { ts: Date.now() });
};

// ── Project Events ────────────────────────────────────────

const onProjectStatusChanged = async (project, newStatus) => {
  const User = require("../models/User");
  if (!project.clientId) return;

  const clientUser = await User.findOne({ clientRef: project.clientId, role: "client" });
  if (!clientUser) return;

  const statusLabels = {
    active:    "is now active",
    completed: "has been completed",
    on_hold:   "is on hold",
    cancelled: "has been cancelled",
  };

  await notify({
    recipientId: clientUser._id,
    type:    "project_status_changed",
    title:   `Project update: ${project.title}`,
    message: `Your project "${project.title}" ${statusLabels[newStatus] || "was updated"}.`,
    link:    `/client/projects`,
    refModel: "Project",
    refId:    project._id,
  });

  emitToUser(clientUser._id, "project:updated", {
    projectId: project._id,
    status:    newStatus,
    progress:  project.progress,
  });
};

// ── Client Portal Events ──────────────────────────────────

const onClientPortalJoined = async (clientUser, freelancerId) => {
  await notify({
    recipientId: freelancerId,
    type:    "client_portal_joined",
    title:   "Client joined portal",
    message: `${clientUser.name} has accepted their portal invite and can now view invoices.`,
    link:    `/clients`,
  });
};

// ── Admin Events ──────────────────────────────────────────

const onPlanChanged = async (userId, newPlan) => {
  await notify({
    recipientId: userId,
    type:    "plan_changed",
    title:   "Your plan was updated",
    message: `An admin has changed your plan to ${newPlan}.`,
    link:    `/settings?tab=billing`,
  });

  emitToUser(userId, "user:plan_changed", { plan: newPlan });
};

const onAccountDeactivated = async (userId) => {
  emitToUser(userId, "auth:force_logout", {
    reason: "Your account has been deactivated by an administrator.",
  });
};

const refreshAdminStats = () => {
  const io = getIO();
  if (io) io.to("role:admin").emit("admin:stats_refresh", { ts: Date.now() });
};

module.exports = {
  notify,
  onInvoiceSent,
  onInvoiceViewed,
  onInvoicePaid,
  onProjectStatusChanged,
  onClientPortalJoined,
  onPlanChanged,
  onAccountDeactivated,
  refreshAdminStats,
};
