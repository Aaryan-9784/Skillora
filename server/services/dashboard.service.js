const Project      = require("../models/Project");
const Task         = require("../models/Task");
const Invoice      = require("../models/Invoice");
const Payment      = require("../models/Payment");
const Client       = require("../models/Client");
const Notification = require("../models/Notification");
const { cacheGet, cacheSet } = require("../config/redis");

/**
 * Single-call dashboard summary.
 * Runs all aggregations in parallel — one network round-trip from the client.
 */
const getDashboardSummary = async (ownerId) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    projectStats,
    taskStats,
    revenueStats,
    recentProjects,
    upcomingTasks,
    unreadNotifications,
  ] = await Promise.all([
    // Project counts by status
    Project.aggregate([
      { $match: { owner: ownerId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id:       null,
          total:     { $sum: 1 },
          active:    { $sum: { $cond: [{ $eq: ["$status", "active"] },    1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          totalBudget: { $sum: "$budget" },
        },
      },
    ]),

    // Task counts by status
    Task.aggregate([
      { $match: { owner: ownerId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id:         null,
          total:       { $sum: 1 },
          todo:        { $sum: { $cond: [{ $eq: ["$status", "todo"] },        1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          done:        { $sum: { $cond: [{ $eq: ["$status", "done"] },        1, 0] } },
        },
      },
    ]),

    // Revenue: paid this month vs last month
    Invoice.aggregate([
      { $match: { owner: ownerId, status: "paid", isDeleted: { $ne: true } } },
      {
        $group: {
          _id:          null,
          totalRevenue: { $sum: "$total" },
          thisMonth:    {
            $sum: {
              $cond: [{ $gte: ["$paidAt", thirtyDaysAgo] }, "$total", 0],
            },
          },
          outstanding: { $sum: 0 }, // placeholder
        },
      },
    ]),

    // 5 most recent projects
    Project.find({ owner: ownerId })
      .sort("-createdAt")
      .limit(5)
      .select("title status budget currency deadline progress taskStats")
      .populate("clientId", "name avatar")
      .lean({ virtuals: true }),

    // Tasks due in next 7 days
    Task.find({
      owner:     ownerId,
      status:    { $in: ["todo", "in_progress"] },
      dueDate:   { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      isDeleted: { $ne: true },
    })
      .sort("dueDate")
      .limit(5)
      .select("title status priority dueDate projectId")
      .populate("projectId", "title")
      .lean(),

    // Unread notification count
    Notification.countDocuments({ recipient: ownerId, read: false }),
  ]);

  return {
    projects:            projectStats[0] || { total: 0, active: 0, completed: 0, totalBudget: 0 },
    tasks:               taskStats[0]    || { total: 0, todo: 0, in_progress: 0, done: 0 },
    revenue:             revenueStats[0] || { totalRevenue: 0, thisMonth: 0 },
    recentProjects,
    upcomingTasks,
    unreadNotifications,
  };
};

module.exports = { getDashboardSummary };
