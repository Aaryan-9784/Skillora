const User    = require("../models/User");
const Project = require("../models/Project");
const Invoice = require("../models/Invoice");
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
    planBreakdown, aiUsage,
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
  ]);

  const stats = {
    users:    { total: totalUsers, new: newUsers, active: activeUsers },
    projects: { total: totalProjects },
    revenue:  { total: totalRevenue[0]?.total || 0 },
    plans:    planBreakdown.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {}),
    ai:       { requestsLast30Days: aiUsage },
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

module.exports = { getPlatformStats, getUsers, updateUser, deleteUser, getRevenueChart };
