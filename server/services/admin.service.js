const User    = require("../models/User");
const Project = require("../models/Project");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const AiLog   = require("../models/AiLog");
const ApiError = require("../utils/ApiError");
const { cacheGet, cacheSet } = require("../config/redis");

const CACHE_TTL = 120; // 2 min

const getPlatformStats = async () => {
  const cacheKey = "admin:platform-stats";
  const cached   = await cacheGet(cacheKey);
  if (cached) return cached;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsers, activeUsers,
    totalProjects, totalRevenue,
    planBreakdown, aiUsage, adminCount,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } }),
    User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } }),
    Project.countDocuments({ isDeleted: { $ne: true } }),
    Invoice.aggregate([
      { $match: { status: "paid", isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]),
    AiLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ role: "admin", isDeleted: { $ne: true } }),
  ]);

  const stats = {
    users:    { total: totalUsers, new: newUsers, active: activeUsers },
    projects: { total: totalProjects },
    revenue:  { total: totalRevenue[0]?.total || 0 },
    plans:    planBreakdown.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {}),
    ai:       { requestsLast30Days: aiUsage },
    adminCount,
  };

  await cacheSet(cacheKey, stats, CACHE_TTL);
  return stats;
};

const getUsers = async ({ page = 1, limit = 20, search, plan, role } = {}) => {
  const filter = { isDeleted: { $ne: true } };
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
  if (plan)   filter.plan = plan;
  if (role)   filter.role = role;

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).select("-password -refreshToken -tokenVersion")
      .sort("-createdAt").skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, total, page, pages: Math.ceil(total / limit) };
};

const updateUser = async (userId, updates) => {
  const allowed = ["role", "plan", "isActive", "isEmailVerified"];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(userId, filtered, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  await user.softDelete();
  return true;
};

const getRevenueChart = async (months = 12) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return Invoice.aggregate([
    { $match: { status: "paid", paidAt: { $gte: since }, isDeleted: { $ne: true } } },
    {
      $group: {
        _id:     { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
        revenue: { $sum: "$total" },
        count:   { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $project: { _id: 0, year: "$_id.year", month: "$_id.month", revenue: 1, count: 1 } },
  ]);
};

// ─── Revenue: plan breakdown + summary cards ───────────────────────────────
const getRevenueSummary = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [totalRevenue, thisMonth, lastMonth, planRevenue, topEarners] = await Promise.all([
    Invoice.aggregate([
      { $match: { status: "paid", isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "paid", paidAt: { $gte: startOfMonth }, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "paid", paidAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    // Revenue by plan (via invoice owner's plan)
    Invoice.aggregate([
      { $match: { status: "paid", isDeleted: { $ne: true } } },
      { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "ownerData" } },
      { $unwind: "$ownerData" },
      { $group: { _id: "$ownerData.plan", revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    // Top 5 earners
    Invoice.aggregate([
      { $match: { status: "paid", isDeleted: { $ne: true } } },
      { $group: { _id: "$owner", total: { $sum: "$total" }, invoices: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 0, name: "$user.name", email: "$user.email", avatar: "$user.avatar", total: 1, invoices: 1 } },
    ]),
  ]);

  const thisMonthTotal = thisMonth[0]?.total || 0;
  const lastMonthTotal = lastMonth[0]?.total || 0;
  const growth = lastMonthTotal > 0
    ? (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
    : null;

  return {
    total:      totalRevenue[0]?.total || 0,
    totalCount: totalRevenue[0]?.count || 0,
    thisMonth:  thisMonthTotal,
    lastMonth:  lastMonthTotal,
    growth,
    byPlan:     planRevenue.reduce((acc, p) => { acc[p._id] = { revenue: p.revenue, count: p.count }; return acc; }, {}),
    topEarners,
  };
};

// ─── Settings: get / update platform config ────────────────────────────────
// Stored in-memory (extend to DB/env as needed)
let _platformConfig = {
  maintenanceMode:    false,
  allowRegistrations: true,
  maxAiRequestsPerDay: 50,
  defaultPlan:        "free",
  supportEmail:       "support@skillora.app",
  platformName:       "Skillora",
};

const getPlatformConfig = async () => ({ ..._platformConfig });

const updatePlatformConfig = async (updates) => {
  const allowed = ["maintenanceMode","allowRegistrations","maxAiRequestsPerDay","defaultPlan","supportEmail","platformName"];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  _platformConfig = { ..._platformConfig, ...filtered };
  return { ..._platformConfig };
};

// ─── Activity log (recent admin-visible events) ────────────────────────────
const getActivityLog = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  // Use recent user registrations + paid invoices as activity feed
  const [recentUsers, recentInvoices, total] = await Promise.all([
    User.find({ isDeleted: { $ne: true } })
      .select("name email role plan createdAt avatar")
      .sort("-createdAt").limit(10).lean(),
    Invoice.find({ status: "paid", isDeleted: { $ne: true } })
      .select("invoiceNumber total paidAt owner")
      .populate("owner", "name email")
      .sort("-paidAt").limit(10).lean(),
    User.countDocuments({ isDeleted: { $ne: true } }),
  ]);

  const events = [
    ...recentUsers.map(u => ({
      type: "user_joined", id: u._id, name: u.name, email: u.email,
      avatar: u.avatar, role: u.role, plan: u.plan, at: u.createdAt,
    })),
    ...recentInvoices.map(i => ({
      type: "invoice_paid", id: i._id, invoiceNumber: i.invoiceNumber,
      amount: i.total, ownerName: i.owner?.name, ownerEmail: i.owner?.email, at: i.paidAt,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(skip, skip + Number(limit));

  return { events, total: total + recentInvoices.length };
};

module.exports = {
  getPlatformStats, getUsers, updateUser, deleteUser, getRevenueChart,
  getRevenueSummary, getPlatformConfig, updatePlatformConfig, getActivityLog,
};
