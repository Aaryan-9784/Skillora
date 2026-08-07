const asyncHandler   = require("../utils/asyncHandler");
const ApiResponse    = require("../utils/ApiResponse");
const billingService = require("../services/billing.service");

/**
 * GET /api/billing
 * Returns current free plan info and workspace status.
 */
const getInfo = asyncHandler(async (req, res) => {
  const info = await billingService.getSubscriptionInfo(req.user._id);
  ApiResponse.success(res, "Subscription info", info);
});

module.exports = { getInfo };
