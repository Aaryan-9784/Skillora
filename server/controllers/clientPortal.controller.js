const asyncHandler    = require("../utils/asyncHandler");
const ApiResponse     = require("../utils/ApiResponse");
const ApiError        = require("../utils/ApiError");
const clientPortalSvc = require("../services/clientPortal.service");
const authService     = require("../services/auth.service");
const Invoice         = require("../models/Invoice");
const Project         = require("../models/Project");
const Client          = require("../models/Client");

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
    } catch { /* sync service may not exist yet */ }
  }

  authService.setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, "Account activated. Welcome!");
});

const clientMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, "Profile fetched", { user: req.user });
});

const getClientInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({
    clientId:  req.user.clientRef,
    isDeleted: { $ne: true },
  })
    .populate("owner", "name email avatar")
    .sort({ createdAt: -1 });
  ApiResponse.success(res, "Invoices fetched", { invoices });
});

const getClientProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    clientId:  req.user.clientRef,
    isDeleted: { $ne: true },
  })
    .populate("owner", "name email avatar")
    .sort({ createdAt: -1 });
  ApiResponse.success(res, "Projects fetched", { projects });
});

const getClientProfile = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.user.clientRef);
  if (!client) throw ApiError.notFound("Client profile not found");
  ApiResponse.success(res, "Profile fetched", { client });
});

const updateClientProfile = asyncHandler(async (req, res) => {
  const { name, phone, company, address } = req.body;
  const client = await Client.findByIdAndUpdate(
    req.user.clientRef,
    { name, phone, company, address },
    { new: true, runValidators: true }
  );
  ApiResponse.success(res, "Profile updated", { client });
});

const getInvoiceDetail = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id:       req.params.id,
    clientId:  req.user.clientRef,
    isDeleted: { $ne: true },
  });

  if (!invoice) throw ApiError.notFound("Invoice not found");

  if (invoice.status === "sent") {
    invoice.status = "viewed";
    await invoice.save();
    try {
      const syncService = require("../services/sync.service");
      await syncService.onInvoiceViewed(invoice);
    } catch { /* sync service may not exist yet */ }
  }

  ApiResponse.success(res, "Invoice fetched", { invoice });
});

module.exports = {
  clientLogin, acceptInvite, clientMe,
  getClientInvoices, getClientProjects,
  getClientProfile, updateClientProfile,
  getInvoiceDetail,
};
