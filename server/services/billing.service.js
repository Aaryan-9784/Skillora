const Razorpay  = require("razorpay");
const crypto    = require("crypto");
const User      = require("../models/User");
const ApiError  = require("../utils/ApiError");
const { getPlan } = require("../config/plans");
const emailService = require("./email.service");
const logger    = require("../utils/logger");

// ── Razorpay client (lazy init) ───────────────────────────
let _razorpay = null;

const getRazorpay = () => {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw ApiError.internal(
        "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env"
      );
    }
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
};

// ── Create Razorpay subscription ──────────────────────────
/**
 * Creates a Razorpay subscription for the given plan.
 * Returns { subscriptionId, shortUrl } — frontend opens shortUrl for payment.
 *
 * Razorpay flow:
 *   1. Backend creates a subscription → gets subscription_id
 *   2. Frontend loads Razorpay checkout with subscription_id
 *   3. User pays → Razorpay fires webhook → backend activates plan
 */
const createSubscription = async (user, planName) => {
  const rz   = getRazorpay();
  const plan = getPlan(planName);

  if (!plan.razorpayPlanId) {
    throw ApiError.badRequest(
      `No Razorpay plan configured for "${planName}". Set RAZORPAY_${planName.toUpperCase()}_PLAN_ID in .env`
    );
  }

  const subscription = await rz.subscriptions.create({
    plan_id:         plan.razorpayPlanId,
    customer_notify: 1,
    quantity:        1,
    total_count:     120, // max billing cycles (10 years)
    notes: {
      userId:   user._id.toString(),
      plan:     planName,
      email:    user.email,
    },
  });

  // Persist subscription ID immediately (status = created)
  await User.findByIdAndUpdate(user._id, {
    "subscription.razorpaySubscriptionId": subscription.id,
    "subscription.status":                 "trialing",
  });

  logger.info(`Razorpay subscription created: ${subscription.id} for user ${user._id}`);

  return {
    subscriptionId: subscription.id,
    keyId:          process.env.RAZORPAY_KEY_ID,
    planName,
    amount:         plan.price,
    currency:       plan.currency || "INR",
    userName:       user.name,
    userEmail:      user.email,
  };
};

// ── Cancel subscription ───────────────────────────────────
const cancelSubscription = async (userId) => {
  const rz   = getRazorpay();
  const user = await User.findById(userId).select("+subscription.razorpaySubscriptionId");

  if (!user?.subscription?.razorpaySubscriptionId) {
    throw ApiError.badRequest("No active subscription found.");
  }

  // cancel_at_cycle_end = 1 → cancels at end of current billing period
  await rz.subscriptions.cancel(user.subscription.razorpaySubscriptionId, true);

  await User.findByIdAndUpdate(userId, {
    "subscription.cancelAtPeriodEnd": true,
  });

  logger.info(`Subscription cancel requested for user ${userId}`);
  return true;
};

// ── Verify payment signature ──────────────────────────────
/**
 * Called after frontend Razorpay checkout completes.
 * Verifies the payment signature and activates the plan.
 */
const verifyPayment = async (userId, { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }) => {
  const secret    = process.env.RAZORPAY_KEY_SECRET;
  const body      = `${razorpay_payment_id}|${razorpay_subscription_id}`;
  const expected  = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (expected !== razorpay_signature) {
    throw ApiError.badRequest("Payment signature verification failed. Do not trust this payment.");
  }

  // Determine plan from subscription notes
  const rz  = getRazorpay();
  const sub = await rz.subscriptions.fetch(razorpay_subscription_id);
  const planName = sub.notes?.plan || "pro";

  const periodEnd = sub.current_end
    ? new Date(sub.current_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await User.findByIdAndUpdate(userId, {
    plan: planName,
    "subscription.razorpaySubscriptionId": razorpay_subscription_id,
    "subscription.status":                 "active",
    "subscription.currentPeriodEnd":       periodEnd,
    "subscription.cancelAtPeriodEnd":      false,
  });

  const user = await User.findById(userId);
  if (user) emailService.sendSubscriptionConfirm(user, planName);

  logger.info(`Payment verified & plan activated: ${planName} for user ${userId}`);
  return { plan: planName, periodEnd };
};

// ── Handle Razorpay webhooks ──────────────────────────────
/**
 * Razorpay sends webhook events to /api/billing/webhook.
 * Signature is in header: x-razorpay-signature
 */
const handleWebhook = async (rawBody, signature) => {
  const secret   = process.env.RAZORPAY_WEBHOOK_SECRET;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    throw ApiError.badRequest("Razorpay webhook signature mismatch");
  }

  const event = JSON.parse(rawBody);
  logger.info(`Razorpay webhook: ${event.event}`);

  const sub     = event.payload?.subscription?.entity;
  const payment = event.payload?.payment?.entity;
  const userId  = sub?.notes?.userId || payment?.notes?.userId;

  switch (event.event) {
    case "subscription.activated": {
      if (userId && sub) {
        const planName  = sub.notes?.plan || "pro";
        const periodEnd = sub.current_end ? new Date(sub.current_end * 1000) : null;
        await User.findByIdAndUpdate(userId, {
          plan: planName,
          "subscription.status":           "active",
          "subscription.currentPeriodEnd": periodEnd,
        });
      }
      break;
    }

    case "subscription.charged": {
      if (userId && sub) {
        const periodEnd = sub.current_end ? new Date(sub.current_end * 1000) : null;
        await User.findByIdAndUpdate(userId, {
          "subscription.status":           "active",
          "subscription.currentPeriodEnd": periodEnd,
        });
      }
      break;
    }

    case "subscription.cancelled":
    case "subscription.completed": {
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          plan: "free",
          "subscription.status":                 "canceled",
          "subscription.razorpaySubscriptionId": null,
        });
      }
      break;
    }

    case "subscription.pending":
    case "payment.failed": {
      if (userId) {
        await User.findByIdAndUpdate(userId, { "subscription.status": "past_due" });
      }
      break;
    }
  }

  return { received: true };
};

// ── Get subscription info ─────────────────────────────────
const getSubscriptionInfo = async (userId) => {
  const user = await User.findById(userId)
    .select("+subscription.razorpayCustomerId +subscription.razorpaySubscriptionId");
  if (!user) throw ApiError.notFound("User not found");

  const plan = getPlan(user.plan);
  return {
    plan:     user.plan,
    planInfo: { name: plan.name, price: plan.price, currency: plan.currency, features: plan.features, limits: plan.limits },
    subscription: {
      status:            user.subscription?.status || "none",
      currentPeriodEnd:  user.subscription?.currentPeriodEnd,
      cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd,
    },
  };
};

module.exports = {
  createSubscription,
  cancelSubscription,
  verifyPayment,
  handleWebhook,
  getSubscriptionInfo,
};
