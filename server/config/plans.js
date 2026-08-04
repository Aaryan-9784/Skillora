/**
 * Skillora Plan Definitions — 100% Free for All Users.
 * Single unified plan with all features unlocked and unlimited resource access.
 */
const PLANS = {
  free: {
    name:     "Free Forever",
    price:    0,
    currency: "INR",
    limits: {
      projects:   Infinity,
      clients:    Infinity,
      invoices:   Infinity,
      aiRequests: Infinity,
      storage:    Infinity,
    },
    features: {
      kanban:          true,
      aiAssistant:     true,
      analytics:       true,
      customDomain:    true,
      prioritySupport: true,
    },
  },
};

const getPlan = () => PLANS.free;

module.exports = { PLANS, getPlan };
