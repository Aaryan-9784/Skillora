const User     = require("../models/User");
const ApiError = require("../utils/ApiError");
const { getPlan } = require("../config/plans");

/**
 * Get current plan & subscription status.
 * Skillora is 100% Free Forever for all users.
 */
const getSubscriptionInfo = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const plan = getPlan();
  return {
    plan:     "free",
    planInfo: {
      name:     plan.name,
      price:    plan.price,
      currency: plan.currency,
      features: plan.features,
      limits:   plan.limits,
    },
    subscription: {
      status:            "active",
      currentPeriodEnd:  null,
      cancelAtPeriodEnd: false,
    },
  };
};

module.exports = {
  getSubscriptionInfo,
};
