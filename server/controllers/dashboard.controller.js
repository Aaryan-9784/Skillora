const asyncHandler       = require("../utils/asyncHandler");
const ApiResponse        = require("../utils/ApiResponse");
const dashboardService   = require("../services/dashboard.service");

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user._id);
  ApiResponse.success(res, "Dashboard summary", summary);
});

module.exports = { getSummary };
