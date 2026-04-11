const jwt      = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User     = require("../models/User");

/**
 * protect — verifies the access token from:
 *   1. HTTP-only cookie (browser clients)
 *   2. Authorization: Bearer <token> header (API clients / mobile)
 *
 * Also validates tokenVersion to support logout-all invalidation.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) throw ApiError.unauthorized("Authentication required");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw ApiError.unauthorized("Access token expired");
    throw ApiError.unauthorized("Invalid access token");
  }

  const user = await User.findById(decoded.id).select("+tokenVersion");
  if (!user)           throw ApiError.unauthorized("User no longer exists");
  if (!user.isActive)  throw ApiError.forbidden("Account has been deactivated");

  // Validate token version — catches logout-all scenarios
  if (decoded.version !== undefined && decoded.version !== user.tokenVersion) {
    throw ApiError.unauthorized("Session invalidated. Please log in again.");
  }

  // Attach clean user (no sensitive fields) to request
  req.user = user;
  next();
});

/**
 * optionalAuth — same as protect but doesn't throw if no token.
 * Useful for routes that behave differently for authenticated users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
});

/**
 * authorize — role-based access control.
 * Must be used after protect.
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' is not allowed to access this resource`));
    }
    next();
  };

/**
 * requireEmailVerified — blocks unverified users from sensitive routes.
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user?.isEmailVerified) {
    return next(ApiError.forbidden("Please verify your email address first"));
  }
  next();
};

module.exports = { protect, optionalAuth, authorize, requireEmailVerified };
