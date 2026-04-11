/**
 * SaaS plan definitions — Razorpay billing.
 * Feature gates are checked in middleware and services.
 */
const PLANS = {
  free: {
    name:  "Free",
    price: 0,
    currency: "INR",
    limits: {
      projects:   3,
      clients:    5,
      invoices:   10,
      aiRequests: 20,   // per month
      storage:    100,  // MB
    },
    features: {
      kanban:          true,
      aiAssistant:     true,
      analytics:       false,
      customDomain:    false,
      prioritySupport: false,
    },
  },
  pro: {
    name:            "Pro",
    price:           1499,   // ₹1,499/month
    currency:        "INR",
    razorpayPlanId:  process.env.RAZORPAY_PRO_PLAN_ID,
    limits: {
      projects:   25,
      clients:    50,
      invoices:   100,
      aiRequests: 200,
      storage:    2048, // 2 GB
    },
    features: {
      kanban:          true,
      aiAssistant:     true,
      analytics:       true,
      customDomain:    false,
      prioritySupport: false,
    },
  },
  premium: {
    name:            "Premium",
    price:           3999,   // ₹3,999/month
    currency:        "INR",
    razorpayPlanId:  process.env.RAZORPAY_PREMIUM_PLAN_ID,
    limits: {
      projects:   Infinity,
      clients:    Infinity,
      invoices:   Infinity,
      aiRequests: Infinity,
      storage:    20480, // 20 GB
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

const getPlan = (planName) => PLANS[planName] || PLANS.free;

module.exports = { PLANS, getPlan };
