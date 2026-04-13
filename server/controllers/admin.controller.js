const asyncHandler   = require("../utils/asyncHandler");
const ApiResponse    = require("../utils/ApiResponse");
const adminService   = require("../services/admin.service");

const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getPlatformStats();
  ApiResponse.success(res, "Platform stats", { stats });
});

const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  ApiResponse.success(res, "Users fetched", result);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body);
  ApiResponse.success(res, "User updated", { user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  ApiResponse.success(res, "User deleted");
});

const getRevenueChart = asyncHandler(async (req, res) => {
  const data = await adminService.getRevenueChart(parseInt(req.query.months, 10) || 12);
  ApiResponse.success(res, "Revenue chart", { data });
});

const getRevenueSummary = asyncHandler(async (req, res) => {
  const data = await adminService.getRevenueSummary();
  ApiResponse.success(res, "Revenue summary", { data });
});

const getPlatformConfig = asyncHandler(async (req, res) => {
  const config = await adminService.getPlatformConfig();
  ApiResponse.success(res, "Platform config", { config });
});

const updatePlatformConfig = asyncHandler(async (req, res) => {
  const config = await adminService.updatePlatformConfig(req.body);
  ApiResponse.success(res, "Config updated", { config });
});

const getActivityLog = asyncHandler(async (req, res) => {
  const data = await adminService.getActivityLog(req.query);
  ApiResponse.success(res, "Activity log", data);
});

module.exports = {
  getStats, getUsers, updateUser, deleteUser, getRevenueChart,
  getRevenueSummary, getPlatformConfig, updatePlatformConfig, getActivityLog,
};
