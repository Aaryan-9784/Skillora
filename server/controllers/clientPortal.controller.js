const asyncHandler    = require("../utils/asyncHandler");
const ApiResponse     = require("../utils/ApiResponse");
const ApiError        = require("../utils/ApiError");
const clientPortalSvc = require("../services/clientPortal.service");
const authService     = require("../services/auth.service");
const Invoice         = require("../models/Invoice");
const Project         = require("../models/Project");
const Client          = require("../models/Client");
const Notification    = require("../models/Notification");
const notify          = require("../utils/notify");
const logger          = require("../utils/logger");

const clientLogin = asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "";
  const { user, accessToken, refreshToken } = await clientPortalSvc.clientLogin({ ...req.body, ip });
  authService.setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, "Login successful", { user, accessToken });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw ApiError.badRequest("Token and password are required");
  const { accessToken, refreshToken, user } = await clientPortalSvc.acceptInvite(token, password);

  if (user.freelancerRef) {
    try {
      const syncService = require("../services/sync.service");
      await syncService.onClientPortalJoined(user, user.freelancerRef);
    } catch (err) { logger.warn(`syncService.onClientPortalJoined warning: ${err.message}`); }
  }

  authService.setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, "Account activated. Welcome!", { accessToken, user });
});

const clientMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, "Profile fetched", { user: req.user });
});

const getClientInvoices = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = { clientId: req.user.clientRef, isDeleted: { $ne: true } };
  if (status) filter.status = status;
  if (search) {
    filter.invoiceNumber = { $regex: search, $options: "i" };
  }

  const invoices = await Invoice.find(filter)
    .populate("owner",     "name email avatar")
    .populate("projectId", "title")
    .sort({ createdAt: -1 });

  ApiResponse.success(res, "Invoices fetched", { invoices });
});

const getClientProjects = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {
    $or: [
      { clientId: req.user.clientRef },
      { clientUser: req.user._id },
      { owner: req.user._id },
    ],
    isDeleted: { $ne: true },
  };
  if (status) filter.status = status;
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const projects = await Project.find(filter)
    .populate("owner", "name email avatar")
    .populate("assignedFreelancer", "name email avatar")
    .sort({ createdAt: -1 });

  ApiResponse.success(res, "Projects fetched", { projects });
});

const deleteClientProject = asyncHandler(async (req, res) => {
  const projectService = require("../services/project.service");
  await projectService.deleteProject(req.params.id, req.user._id);
  ApiResponse.success(res, "Project deleted and client/freelancer disconnected");
});

const getClientProfile = asyncHandler(async (req, res) => {
  let client = null;
  if (req.user.clientRef) {
    client = await Client.findById(req.user.clientRef);
  }
  // Fallback: build profile from User data if no Client document linked
  if (!client) {
    client = {
      _id:     req.user._id,
      name:    req.user.name    || "",
      email:   req.user.email   || "",
      phone:   req.user.phone   || "",
      company: req.user.company || "",
      address: req.user.address || "",
      avatar:  req.user.avatar  || "",
    };
  }
  ApiResponse.success(res, "Client profile fetched", { client });
});

const updateClientProfile = asyncHandler(async (req, res) => {
  const { name, phone, company, address, avatar } = req.body;
  const User = require("../models/User");

  // Sync to User model
  const userUpdates = {};
  if (name !== undefined)    userUpdates.name    = name;
  if (avatar !== undefined)  userUpdates.avatar  = avatar;
  if (phone !== undefined)   userUpdates.phone   = phone;
  if (company !== undefined) userUpdates.company = company;
  if (address !== undefined) userUpdates.address = address;

  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(req.user._id, userUpdates);
  }

  const updatedUser = await User.findById(req.user._id);

  // Sync to all Client model instances linked to this user/email
  const clientUpdates = {};
  if (name !== undefined)    clientUpdates.name    = name;
  if (phone !== undefined)   clientUpdates.phone   = phone;
  if (company !== undefined) clientUpdates.company = company;
  if (address !== undefined) clientUpdates.address = address;
  if (avatar !== undefined)  clientUpdates.avatar  = avatar;

  if (Object.keys(clientUpdates).length > 0) {
    await Client.updateMany(
      { $or: [{ owner: req.user._id }, { email: req.user.email }, ...(req.user.clientRef ? [{ _id: req.user.clientRef }] : [])] },
      clientUpdates
    );
  }

  let client = req.user.clientRef ? await Client.findById(req.user.clientRef) : null;
  if (!client) {
    client = await Client.findOne({ $or: [{ owner: req.user._id }, { email: req.user.email }] });
  }

  if (!client) {
    client = {
      _id:     updatedUser._id,
      name:    updatedUser.name    || "",
      email:   updatedUser.email   || "",
      phone:   updatedUser.phone   || "",
      company: updatedUser.company || "",
      address: updatedUser.address || "",
      avatar:  updatedUser.avatar  || "",
    };
  }

  ApiResponse.success(res, "Client profile updated", { client, user: updatedUser });
});

const getInvoiceDetail = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    $or: [
      { clientId: req.user.clientRef },
      { clientEmail: req.user.email },
      { clientUser: req.user._id },
    ],
    isDeleted: { $ne: true },
  })
    .populate("owner",     "name email avatar")
    .populate("projectId", "title");

  if (!invoice) throw ApiError.notFound("Invoice not found");

  if (invoice.status === "sent") {
    invoice.status = "viewed";
    await invoice.save();
    try {
      const syncService = require("../services/sync.service");
      await syncService.onInvoiceViewed(invoice);
    } catch (err) { logger.warn(`syncService.onInvoiceViewed warning: ${err.message}`); }
  }

  ApiResponse.success(res, "Invoice fetched", { invoice });
});

/**
 * GET /api/client/finance-summary
 * Returns financial KPIs for the client dashboard.
 */
const getFinanceSummary = asyncHandler(async (req, res) => {
  const clientId = req.user.clientRef;

  const invoices = await Invoice.find({ clientId, isDeleted: { $ne: true } });

  const totalPaid    = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter((i) => ["sent","viewed"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.total, 0);
  const lastPaid     = invoices
    .filter((i) => i.status === "paid" && i.paidAt)
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0];

  // Month-over-month trend
  const now = new Date();
  const thisMonth = invoices
    .filter((i) => i.status === "paid" && i.paidAt && new Date(i.paidAt).getMonth() === now.getMonth() && new Date(i.paidAt).getFullYear() === now.getFullYear())
    .reduce((s, i) => s + i.total, 0);
  const lastMonth = invoices
    .filter((i) => {
      if (i.status !== "paid" || !i.paidAt) return false;
      const d = new Date(i.paidAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    })
    .reduce((s, i) => s + i.total, 0);

  const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  ApiResponse.success(res, "Finance summary", {
    totalPaid,
    totalPending,
    totalOverdue,
    lastPayment: lastPaid ? { amount: lastPaid.total, date: lastPaid.paidAt, invoiceNumber: lastPaid.invoiceNumber } : null,
    trend,
    overdueCount:  invoices.filter((i) => i.status === "overdue").length,
    pendingCount:  invoices.filter((i) => ["sent","viewed"].includes(i.status)).length,
    activeProjects: await Project.countDocuments({ clientId, status: "active", isDeleted: { $ne: true } }),
  });
});

/**
 * GET /api/client/activity?page=1&limit=20
 * Returns paginated activity feed from client's notifications.
 */
const getClientActivity = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipient: req.user._id }),
  ]);

  ApiResponse.success(res, "Activity fetched", {
    data:       items,
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  });
});

/**
 * GET /api/client/notifications
 * GET /api/client/notifications/unread-count
 * PATCH /api/client/notifications/:id/read
 * PATCH /api/client/notifications/read-all
 */
const getClientNotifications = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const skip  = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Notification.find({ recipient: req.user._id }).sort("-createdAt").skip(skip).limit(limit).lean(),
    Notification.countDocuments({ recipient: req.user._id }),
  ]);

  ApiResponse.success(res, "Notifications fetched", {
    data:       items,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

const getClientUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
  ApiResponse.success(res, "Unread count", { count });
});

const markClientNotificationRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true, readAt: new Date() }
  );
  ApiResponse.success(res, "Marked as read");
});

const markAllClientNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.markAllRead(req.user._id);
  ApiResponse.success(res, "All marked as read");
});

/**
 * POST /api/client/invoices/:id/pay
 * Initiates Razorpay payment for an invoice.
 */
const initiateInvoicePayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    $or: [
      { clientId: req.user.clientRef },
      { clientEmail: req.user.email },
      { clientUser: req.user._id },
    ],
    isDeleted: { $ne: true },
  }).populate("owner", "name email");

  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === "paid") throw ApiError.badRequest("Invoice is already paid");
  if (invoice.status === "cancelled") throw ApiError.badRequest("Invoice is cancelled");

  // Razorpay order creation
  const Razorpay = require("razorpay");
  const rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await rzp.orders.create({
    amount:   Math.round(invoice.total * 100), // paise
    currency: invoice.currency === "USD" ? "USD" : "INR",
    receipt:  invoice.invoiceNumber,
    notes:    { invoiceId: invoice._id.toString(), clientId: (req.user.clientRef || req.user._id).toString() },
  });

  ApiResponse.success(res, "Payment order created", {
    orderId:       order.id,
    amount:        order.amount,
    currency:      order.currency,
    keyId:         process.env.RAZORPAY_KEY_ID,
    invoiceNumber: invoice.invoiceNumber,
    freelancerName: invoice.owner?.name,
  });
});

/**
 * POST /api/client/invoices/:id/pay/verify
 * Verifies Razorpay payment signature and marks invoice as paid.
 */
const verifyInvoicePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const crypto = require("crypto");

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    throw ApiError.badRequest("Payment verification failed — invalid signature");
  }

  const invoice = await Invoice.findOne({
    _id: req.params.id,
    $or: [
      { clientId: req.user.clientRef },
      { clientEmail: req.user.email },
      { clientUser: req.user._id },
    ],
    isDeleted: { $ne: true },
  });

  if (!invoice) throw ApiError.notFound("Invoice not found");

  invoice.status = "paid";
  invoice.paidAt = new Date();
  await invoice.save();

  // Notify freelancer
  await notify({
    recipient: invoice.owner,
    type:      "payment_received",
    title:     "Payment received",
    message:   `${req.user.name} paid invoice ${invoice.invoiceNumber} — ₹${invoice.total.toLocaleString()}`,
    refModel:  "Invoice",
    refId:     invoice._id,
  });

  // Emit real-time update to freelancer & admin stats
  try {
    const { emitToUser, broadcast } = require("../config/socket");
    emitToUser(invoice.owner, "invoice:updated", {
      invoiceId: invoice._id,
      status:    "paid",
    });
    broadcast("admin:stats_refresh", { ts: Date.now() });
  } catch (err) { logger.warn(`socket update invoice warning: ${err.message}`); }

  ApiResponse.success(res, "Payment successful", { invoice });
});

/**
 * POST /api/client/projects/:id/milestones/:milestoneId/approve
 * Client approves a milestone.
 */
const approveMilestone = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    $or: [
      { clientId: req.user.clientRef },
      { clientUser: req.user._id },
      { owner: req.user._id },
    ],
    isDeleted: { $ne: true },
  });
  if (!project) throw ApiError.notFound("Project not found");

  const milestone = project.milestones?.id(req.params.milestoneId);
  if (!milestone) throw ApiError.notFound("Milestone not found");

  milestone.status    = "approved";
  milestone.approvedAt = new Date();
  await project.save();

  await notify({
    recipient: project.owner,
    type:      "project_updated",
    title:     "Milestone approved",
    message:   `${req.user.name} approved milestone "${milestone.title}" on ${project.title}`,
    refModel:  "Project",
    refId:     project._id,
  });

  try {
    const { emitToUser } = require("../config/socket");
    emitToUser(project.owner, "milestone:updated", {
      projectId:   project._id,
      milestoneId: milestone._id,
      status:      "approved",
    });
  } catch (err) { logger.warn(`socket update milestone warning: ${err.message}`); }

  ApiResponse.success(res, "Milestone approved", { milestone });
});

/**
 * POST /api/client/projects/:id/milestones/:milestoneId/request-changes
 */
const requestMilestoneChanges = asyncHandler(async (req, res) => {
  const { feedback } = req.body;
  const project = await Project.findOne({
    _id: req.params.id,
    $or: [
      { clientId: req.user.clientRef },
      { clientUser: req.user._id },
      { owner: req.user._id },
    ],
    isDeleted: { $ne: true },
  });
  if (!project) throw ApiError.notFound("Project not found");

  const milestone = project.milestones?.id(req.params.milestoneId);
  if (!milestone) throw ApiError.notFound("Milestone not found");

  milestone.status   = "changes_requested";
  milestone.feedback = feedback || "";
  await project.save();

  await notify({
    recipient: project.owner,
    type:      "project_updated",
    title:     "Changes requested",
    message:   `${req.user.name} requested changes on milestone "${milestone.title}"${feedback ? `: ${feedback}` : ""}`,
    refModel:  "Project",
    refId:     project._id,
  });

  try {
    const { emitToUser } = require("../config/socket");
    emitToUser(project.owner, "milestone:updated", {
      projectId:   project._id,
      milestoneId: milestone._id,
      status:      "changes_requested",
    });
  } catch (err) { logger.warn(`socket milestone changes warning: ${err.message}`); }

  ApiResponse.success(res, "Changes requested", { milestone });
});

/**
 * GET /api/client/messages/:projectId
 * POST /api/client/messages/:projectId
 * Real-time project chat.
 */
const getProjectMessages = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.projectId,
    $or: [
      { clientId: req.user.clientRef },
      { clientUser: req.user._id },
      { owner: req.user._id },
    ],
    isDeleted: { $ne: true },
  });
  if (!project) throw ApiError.notFound("Project not found");

  const Conversation = require("../models/Conversation");
  const Message      = require("../models/Message");

  let conversation = await Conversation.findOne({ projectId: req.params.projectId });
  if (!conversation) {
    const participants = Array.from(
      new Set([req.user._id, project.owner, project.assignedFreelancer].filter(Boolean))
    );
    conversation = await Conversation.create({
      type: "project",
      projectId: req.params.projectId,
      participants,
    });
  }

  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 30;
  const skip  = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversationId: conversation._id })
      .populate("sender", "name avatar role")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversationId: conversation._id }),
  ]);

  ApiResponse.success(res, "Messages fetched", {
    data:       messages.reverse(),
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

const sendProjectMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw ApiError.badRequest("Message content is required");

  const project = await Project.findOne({
    _id: req.params.projectId,
    $or: [
      { clientId: req.user.clientRef },
      { clientUser: req.user._id },
      { owner: req.user._id },
    ],
    isDeleted: { $ne: true },
  });
  if (!project) throw ApiError.notFound("Project not found");

  const Conversation = require("../models/Conversation");
  const Message      = require("../models/Message");

  let conversation = await Conversation.findOne({ projectId: req.params.projectId });
  if (!conversation) {
    const participants = Array.from(
      new Set([req.user._id, project.owner, project.assignedFreelancer].filter(Boolean))
    );
    conversation = await Conversation.create({
      type: "project",
      projectId: req.params.projectId,
      participants,
    });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    sender:         req.user._id,
    content:        content.trim(),
  });

  conversation.lastMessage = {
    text:      content.trim(),
    sender:    req.user._id,
    createdAt: new Date(),
  };
  await conversation.save();

  await message.populate("sender", "name avatar role");

  // Notify freelancer in DB & push real-time socket event
  await notify({
    recipient: project.owner,
    type:      "system",
    title:     `New message from ${req.user.name}`,
    message:   content.trim().slice(0, 100),
    link:      `/projects/${project._id}`,
    refModel:  "Project",
    refId:     project._id,
  });

  try {
    const { emitToUser } = require("../config/socket");
    emitToUser(project.owner, "message:new", {
      projectId: req.params.projectId,
      message,
    });
  } catch (err) { logger.warn(`socket emit message warning: ${err.message}`); }

  ApiResponse.success(res, "Message sent", { message });
});

// ── Revenue analytics (client-scoped) ────────────────────
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const Invoice = require("../models/Invoice");
  const clientRef = req.user.clientRef;

  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const data = await Invoice.aggregate([
    {
      $match: {
        clientId:  clientRef,
        status:    "paid",
        paidAt:    { $gte: since },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
        revenue:      { $sum: "$total" },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id:          0,
        year:         "$_id.year",
        month:        "$_id.month",
        revenue:      1,
        invoiceCount: 1,
      },
    },
  ]);

  ApiResponse.success(res, "Revenue analytics", { data });
});

// ── AI Insights (simple summary for client) ───────────────
const getAiInsights = asyncHandler(async (req, res) => {
  const Invoice = require("../models/Invoice");
  const Project = require("../models/Project");
  const clientRef = req.user.clientRef;

  const [invoiceStats, projectStats] = await Promise.all([
    Invoice.aggregate([
      { $match: { clientId: clientRef, isDeleted: { $ne: true } } },
      {
        $group: {
          _id:         null,
          total:       { $sum: 1 },
          paid:        { $sum: { $cond: [{ $eq: ["$status", "paid"] },    1, 0] } },
          overdue:     { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] } },
          totalAmount: { $sum: "$total" },
          paidAmount:  { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$total", 0] } },
        },
      },
    ]),
    Project.countDocuments({ clientId: clientRef, status: "active", isDeleted: { $ne: true } }),
  ]);

  const inv = invoiceStats[0] || { total: 0, paid: 0, overdue: 0, totalAmount: 0, paidAmount: 0 };
  const payRate = inv.total > 0 ? Math.round((inv.paid / inv.total) * 100) : 0;

  const lines = [];
  if (inv.overdue > 0)  lines.push(`⚠️ You have ${inv.overdue} overdue invoice${inv.overdue > 1 ? "s" : ""} — please settle them to avoid late fees.`);
  if (payRate >= 80)    lines.push(`✅ Great payment record — ${payRate}% of your invoices are paid on time.`);
  if (projectStats > 0) lines.push(`🚀 You have ${projectStats} active project${projectStats > 1 ? "s" : ""} in progress.`);
  if (lines.length === 0) lines.push("📊 No significant insights yet. Activity will appear here as your projects progress.");

  ApiResponse.success(res, "AI insights", { insights: lines.join("\n\n") });
});



module.exports = {
  clientLogin, acceptInvite, clientMe,
  getClientInvoices, getClientProjects, deleteClientProject,
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
};
