const ApiError   = require("../utils/ApiError");
const { getPlan } = require("../config/plans");
const Project    = require("../models/Project");
const Client     = require("../models/Client");
const Invoice    = require("../models/Invoice");

/**
 * requireFeature — blocks access if the user's plan doesn't include a feature.
 * @param {string} feature - key from plan.features
 */
const requireFeature = (feature) => (req, res, next) => {
  const plan = getPlan(req.user?.plan || "free");
  if (!plan.features[feature]) {
    return next(
      ApiError.forbidden(
        `This feature requires a higher plan. Upgrade to access "${feature}".`
      )
    );
  }
  next();
};

/**
 * checkLimit — verifies the user hasn't exceeded their plan's resource limit.
 * @param {"projects"|"clients"|"invoices"} resource
 */
const checkLimit = (resource) => async (req, res, next) => {
  try {
    const plan  = getPlan(req.user?.plan || "free");
    const limit = plan.limits[resource];
    if (limit === Infinity) return next();

    const models = { projects: Project, clients: Client, invoices: Invoice };
    const Model  = models[resource];
    if (!Model) return next();

    const count = await Model.countDocuments({ owner: req.user._id, isDeleted: { $ne: true } });
    if (count >= limit) {
      return next(
        ApiError.forbidden(
          `You've reached the ${resource} limit (${limit}) for your ${req.user.plan} plan. Upgrade to add more.`
        )
      );
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireFeature, checkLimit };
