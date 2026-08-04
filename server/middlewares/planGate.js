/**
 * Plan Middleware — Skillora is 100% Free for All Users.
 * All feature gates and resource limit checks pass freely.
 */

const requireFeature = () => (req, res, next) => next();

const checkLimit = () => (req, res, next) => next();

const planGate = () => (req, res, next) => next();

module.exports = { requireFeature, checkLimit, planGate };
