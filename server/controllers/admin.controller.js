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

module.exports = { getStats, getUsers, updateUser, deleteUser, getRevenueChart };
