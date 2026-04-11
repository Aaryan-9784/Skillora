const asyncHandler   = require("../utils/asyncHandler");
const ApiResponse    = require("../utils/ApiResponse");
const ApiError       = require("../utils/ApiError");
const billingService = require("../services/billing.service");

/**
 * GET /api/billing
 * Returns current plan + subscription status.
 */
const getInfo = asyncHandler(async (req, res) => {
  const info = await billingService.getSubscriptionInfo(req.user._id);
  ApiResponse.success(res, "Subscription info", info);
});

/**
 * POST /api/billing/subscribe
 * Body: { plan: "pro" | "premium" }
 * Returns Razorpay subscription details for frontend checkout.
 */
const subscribe = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!plan || !["pro", "premium"].includes(plan)) {
    throw ApiError.badRequest("plan must be 'pro' or 'premium'");
  }
  const data = await billingService.createSubscription(req.user, plan);
  ApiResponse.success(res, "Subscription created", data);
});

/**
 * POST /api/billing/verify
 * Body: { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
 * Called after frontend Razorpay checkout succeeds.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    throw ApiError.badRequest("razorpay_payment_id, razorpay_subscription_id, and razorpay_signature are required");
  }
  const result = await billingService.verifyPayment(req.user._id, req.body);
  ApiResponse.success(res, "Payment verified. Plan activated!", result);
});

/**
 * POST /api/billing/cancel
 * Cancels subscription at end of current billing period.
 */
const cancelSubscription = asyncHandler(async (req, res) => {
  await billingService.cancelSubscription(req.user._id);
  ApiResponse.success(res, "Subscription will be cancelled at the end of the billing period.");
});

/**
 * POST /api/billing/webhook
 * Razorpay webhook — raw body, verified by HMAC signature.
 */
const webhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const result    = await billingService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getInfo, subscribe, verifyPayment, cancelSubscription, webhook };
