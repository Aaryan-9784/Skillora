const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const User   = require("../models/User");
const ApiError = require("../utils/ApiError");
const logger   = require("../utils/logger");

// ── Token generation ──────────────────────────────────────

/**
 * Sign a short-lived access token.
 * Payload includes tokenVersion to support invalidation.
 */
const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, version: user.tokenVersion },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );

/**
 * Sign a long-lived refresh token.
 */
const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, version: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );

const generateTokens = (user) => ({
  accessToken:  signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

// ── Cookie helpers ────────────────────────────────────────

const COOKIE_OPTS = (maxAge) => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  // "lax" is required for OAuth — "strict" blocks cookies when the browser
  // is redirected back from Google/GitHub (cross-site navigation)
  sameSite: "lax",
  maxAge,
});

/**
 * Write both tokens to HTTP-only cookies.
 * Access token cookie is also readable by the frontend JS for in-memory storage.
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  // Refresh token — long-lived, HTTP-only, never readable by JS
  res.cookie("refreshToken", refreshToken, COOKIE_OPTS(7 * 24 * 60 * 60 * 1000));

  // Access token — short-lived, HTTP-only
  // Frontend reads it once via /auth/me and stores in memory
  res.cookie("accessToken", accessToken, COOKIE_OPTS(15 * 60 * 1000));
};

const clearTokenCookies = (res) => {
  res.clearCookie("accessToken",  { httpOnly: true, sameSite: "lax" });
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax" });
};

// ── Register ──────────────────────────────────────────────

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, password, provider: "local" });
  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Send welcome email (fire-and-forget)
  const emailService = require("./email.service");
  emailService.sendWelcome(user);

  logger.info(`New user registered: ${email}`);
  return { user, accessToken, refreshToken };
};

// ── Login ─────────────────────────────────────────────────

const login = async ({ email, password, ip = "" }) => {
  const user = await User.findOne({ email })
    .select("+password +refreshToken +loginAttempts +lockUntil");

  // Generic message to prevent user enumeration
  if (!user || user.provider !== "local") {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Account locked?
  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw ApiError.unauthorized(
      `Account temporarily locked. Try again in ${minutesLeft} minute(s).`
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Successful login — reset attempts
  await user.resetLoginAttempts();

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  user.lastLoginIp  = ip;
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email} from ${ip}`);
  return { user, accessToken, refreshToken };
};

// ── OAuth login / register ────────────────────────────────

/**
 * Called after Passport successfully authenticates an OAuth user.
 * Issues our own JWT pair.
 */
const oauthLogin = async (user, ip = "") => {
  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  user.lastLoginIp  = ip;
  await user.save({ validateBeforeSave: false });
  return { user, accessToken, refreshToken };
};

// ── Refresh token rotation ────────────────────────────────

const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) throw ApiError.unauthorized("No refresh token provided");

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? "Refresh token expired" : "Invalid refresh token";
    throw ApiError.unauthorized(msg);
  }

  const user = await User.findById(decoded.id).select("+refreshToken +tokenVersion");
  if (!user) throw ApiError.unauthorized("User not found");

  // Token reuse detection — if stored token doesn't match, someone stole it
  if (user.refreshToken !== incomingRefreshToken) {
    // Invalidate all tokens for this user (security measure)
    await User.findByIdAndUpdate(decoded.id, { refreshToken: null, $inc: { tokenVersion: 1 } });
    logger.warn(`Refresh token reuse detected for user ${decoded.id}`);
    throw ApiError.unauthorized("Token reuse detected. Please log in again.");
  }

  // Version check — ensures old tokens are invalid after logout-all
  if (decoded.version !== user.tokenVersion) {
    throw ApiError.unauthorized("Token invalidated. Please log in again.");
  }

  // Rotate: issue new pair
  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ── Logout ────────────────────────────────────────────────

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Logout from ALL devices by bumping tokenVersion.
 * All existing refresh tokens become invalid immediately.
 */
const logoutAll = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
    $inc: { tokenVersion: 1 },
  });
};

// ── Password reset token ──────────────────────────────────

const createPasswordResetToken = async (email) => {
  const user = await User.findOne({ email, provider: "local" });
  if (!user) {
    // Don't reveal whether email exists
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken   = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });

  return resetToken; // send this via email
};

const resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken:   hashed,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest("Token is invalid or has expired");

  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion         += 1; // invalidate all existing sessions
  await user.save();

  return user;
};

module.exports = {
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  register,
  login,
  oauthLogin,
  refreshAccessToken,
  logout,
  logoutAll,
  createPasswordResetToken,
  resetPassword,
};
