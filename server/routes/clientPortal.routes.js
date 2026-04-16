const router = require("express").Router();
const { protect, requireClient } = require("../middlewares/auth.middleware");
const { authLimiter }            = require("../middlewares/rateLimiter");
const {
  clientLogin, acceptInvite, clientMe,
  getClientInvoices, getClientProjects,
  getClientProfile, updateClientProfile,
  getInvoiceDetail,
  getFinanceSummary,
  getRevenueAnalytics,
  getAiInsights,
  getClientActivity,
  getClientNotifications, getClientUnreadCount,
  markClientNotificationRead, markAllClientNotificationsRead,
  initiateInvoicePayment, verifyInvoicePayment,
  approveMilestone, requestMilestoneChanges,
  getProjectMessages, sendProjectMessage,
} = require("../controllers/clientPortal.controller");

// ── Public ────────────────────────────────────────────────
router.post("/login",         authLimiter, clientLogin);
router.post("/accept-invite", authLimiter, acceptInvite);

// ── Protected (client role only) ─────────────────────────
router.use(protect, requireClient);

// Core
router.get("/me",           clientMe);
router.get("/profile",      getClientProfile);
router.patch("/profile",    updateClientProfile);

// Finance
router.get("/finance-summary",    getFinanceSummary);
router.get("/revenue-analytics",  getRevenueAnalytics);
router.get("/ai-insights",        getAiInsights);

// Invoices
router.get("/invoices",                    getClientInvoices);
router.get("/invoices/:id",                getInvoiceDetail);
router.post("/invoices/:id/pay",           initiateInvoicePayment);
router.post("/invoices/:id/pay/verify",    verifyInvoicePayment);

// Projects
router.get("/projects",                                                    getClientProjects);
router.post("/projects/:id/milestones/:milestoneId/approve",               approveMilestone);
router.post("/projects/:id/milestones/:milestoneId/request-changes",       requestMilestoneChanges);

// Messages
router.get("/messages/:projectId",  getProjectMessages);
router.post("/messages/:projectId", sendProjectMessage);

// Activity
router.get("/activity", getClientActivity);

// Notifications
router.get("/notifications",              getClientNotifications);
router.get("/notifications/unread-count", getClientUnreadCount);
router.patch("/notifications/read-all",   markAllClientNotificationsRead);
router.patch("/notifications/:id/read",   markClientNotificationRead);

module.exports = router;
