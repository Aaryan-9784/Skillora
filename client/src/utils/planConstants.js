/**
 * Frontend mirror of server/config/plans.js
 * Keep in sync with backend plan definitions.
 */
export const PLANS = {
  free: {
    name:     "Free",
    price:    0,
    currency: "INR",
    limits:   { projects: 3, clients: 5, invoices: 10, aiRequests: 20 },
    features: { kanban: true, aiAssistant: true, analytics: false, customDomain: false, prioritySupport: false },
  },
  pro: {
    name:     "Pro",
    price:    1499,
    currency: "INR",
    limits:   { projects: 25, clients: 50, invoices: 100, aiRequests: 200 },
    features: { kanban: true, aiAssistant: true, analytics: true, customDomain: false, prioritySupport: false },
  },
  premium: {
    name:     "Premium",
    price:    3999,
    currency: "INR",
    limits:   { projects: Infinity, clients: Infinity, invoices: Infinity, aiRequests: Infinity },
    features: { kanban: true, aiAssistant: true, analytics: true, customDomain: true, prioritySupport: true },
  },
};
