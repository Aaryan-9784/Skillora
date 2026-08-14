const jwt       = require("jsonwebtoken");
const crypto    = require("crypto");
const speakeasy = require("speakeasy");
const QRCode    = require("qrcode");
const User      = require("../models/User");
const ApiError  = require("../utils/ApiError");
const logger    = require("../utils/logger");

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

// Parse JWT expiry string (e.g. "2h", "30d", "15m") to milliseconds
const parseExpiry = (str = "15m") => {
  const unit = str.slice(-1);
  const val  = parseInt(str, 10);
  const map  = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return (map[unit] || 60_000) * val;
};

const COOKIE_OPTS = (maxAge) => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge,
});

const setTokenCookies = (res, accessToken, refreshToken) => {
  // Cookie maxAge must match JWT expiry — if cookie dies before JWT the
  // browser stops sending it and silent refresh breaks unnecessarily
  const accessMaxAge  = parseExpiry(process.env.JWT_ACCESS_EXPIRES  || "2h");
  const refreshMaxAge = parseExpiry(process.env.JWT_REFRESH_EXPIRES || "30d");

  res.cookie("refreshToken", refreshToken, COOKIE_OPTS(refreshMaxAge));
  res.cookie("accessToken",  accessToken,  COOKIE_OPTS(accessMaxAge));
};

const clearTokenCookies = (res) => {
  res.clearCookie("accessToken",  { httpOnly: true, sameSite: "lax" });
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax" });
};

// ── Register ──────────────────────────────────────────────

const register = async ({ name, email, password, role = "freelancer" }) => {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  // Only allow freelancer or client self-registration (admin is seeded only)
  const allowedRoles = ["freelancer", "client"];
  const userRole = allowedRoles.includes(role) ? role : "freelancer";

  const user = await User.create({ name, email, password, role: userRole, provider: "local" });
  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Send welcome email (fire-and-forget)
  const emailService = require("./email.service");
  emailService.sendWelcome(user);

  logger.info(`New user registered: ${email} (role: ${userRole})`);
  return { user, accessToken, refreshToken };
};

// ── Login ─────────────────────────────────────────────────

const login = async ({ email, password, ip = "" }) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } })
    .select("+password +refreshToken +loginAttempts +lockUntil");

  // Generic message to prevent user enumeration
  if (!user || !user.password) {
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

  // Successful password check — reset attempts
  await user.resetLoginAttempts();

  // If 2FA enabled, return mfaToken challenge
  if (user.isTwoFactorEnabled) {
    const mfaToken = jwt.sign(
      { id: user._id, mfa: true },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "5m" }
    );
    return { require2FA: true, mfaToken };
  }

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
  const normalizedEmail = (email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
  if (!user) {
    // Don't reveal whether email exists
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken   = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });

  return { user, resetToken };
};

const resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken:   hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires +password +tokenVersion");

  if (!user) throw ApiError.badRequest("Token is invalid or has expired");

  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion         += 1; // invalidate all existing sessions
  await user.save();

  return user;
};

// ── Two-Factor Authentication (TOTP) ──────────────────────

const setup2FA = async (userId) => {
  const user = await User.findById(userId).select("+twoFactorSecret");
  if (!user) throw ApiError.notFound("User not found");

  let secret = user.twoFactorSecret;
  if (!secret || !user.isTwoFactorEnabled) {
    const generated = speakeasy.generateSecret({
      length: 20,
      name: `Skillora (${user.email})`,
      issuer: "Skillora",
    });
    secret = generated.base32;
    user.twoFactorSecret = secret;
    await user.save({ validateBeforeSave: false });
  }

  const otpauth = speakeasy.otpauthURL({
    secret,
    label: `Skillora (${user.email})`,
    issuer: "Skillora",
    encoding: "base32",
  });

  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  return { secret, qrCodeUrl, otpauth };
};

const enable2FA = async (userId, token) => {
  const cleanToken = (token || "").toString().replace(/[\s-]/g, "").trim();
  if (!cleanToken) throw ApiError.badRequest("Verification token is required");

  const user = await User.findById(userId).select("+twoFactorSecret +twoFactorBackupCodes");
  if (!user) throw ApiError.notFound("User not found");
  if (!user.twoFactorSecret) throw ApiError.badRequest("Please request 2FA setup QR code first");

  const isValid = speakeasy.totp.verify({
    secret:   user.twoFactorSecret,
    encoding: "base32",
    token:    cleanToken,
    window:   2,
  });
  if (!isValid) throw ApiError.badRequest("Invalid 2FA passcode. Please check your authenticator app.");

  // Generate 10 single-use 8-character backup codes
  const plainBackupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  user.isTwoFactorEnabled = true;
  user.twoFactorBackupCodes = plainBackupCodes.map((code) => ({ code, used: false }));
  await user.save({ validateBeforeSave: false });

  logger.info(`2FA enabled for user ${user.email}`);
  return { backupCodes: plainBackupCodes };
};

const disable2FA = async (userId, token) => {
  const cleanToken = (token || "").toString().replace(/[\s-]/g, "").trim();
  if (!cleanToken) throw ApiError.badRequest("Verification token is required");

  const user = await User.findById(userId).select("+twoFactorSecret +twoFactorBackupCodes");
  if (!user) throw ApiError.notFound("User not found");
  if (!user.isTwoFactorEnabled) throw ApiError.badRequest("2FA is not enabled on this account");

  let isValid = false;
  if (user.twoFactorSecret) {
    isValid = speakeasy.totp.verify({
      secret:   user.twoFactorSecret,
      encoding: "base32",
      token:    cleanToken,
      window:   2,
    });
  }

  // Also allow disabling via an unused backup code
  if (!isValid && Array.isArray(user.twoFactorBackupCodes) && user.twoFactorBackupCodes.length > 0) {
    const backupIndex = user.twoFactorBackupCodes.findIndex(
      (b) => !b.used && b.code && b.code.toUpperCase() === cleanToken.toUpperCase()
    );
    if (backupIndex !== -1) {
      isValid = true;
    }
  }

  if (!isValid) throw ApiError.badRequest("Invalid 2FA passcode or backup code");

  user.isTwoFactorEnabled = false;
  user.twoFactorSecret = null;
  user.twoFactorBackupCodes = [];
  await user.save({ validateBeforeSave: false });

  logger.info(`2FA disabled for user ${user.email}`);
  return true;
};

const verify2FALogin = async ({ mfaToken, code, ip = "" }) => {
  const cleanCode = (code || "").toString().replace(/[\s-]/g, "").trim();
  if (!mfaToken || !cleanCode) throw ApiError.badRequest("MFA token and verification code are required");

  let decoded;
  try {
    decoded = jwt.verify(mfaToken, process.env.JWT_ACCESS_SECRET);
    if (!decoded.mfa) throw new Error("Invalid token type");
  } catch {
    throw ApiError.unauthorized("MFA session expired. Please sign in again.");
  }

  const user = await User.findById(decoded.id).select("+twoFactorSecret +twoFactorBackupCodes +tokenVersion +refreshToken");
  if (!user || !user.isActive) throw ApiError.unauthorized("User account invalid");

  let isValid = false;
  let isBackupCode = false;

  // Check 6-digit TOTP code
  if (cleanCode.length === 6 && /^\d+$/.test(cleanCode) && user.twoFactorSecret) {
    isValid = speakeasy.totp.verify({
      secret:   user.twoFactorSecret,
      encoding: "base32",
      token:    cleanCode,
      window:   2,
    });
  }

  // Check backup code if TOTP failed or code is an 8-char backup code
  if (!isValid && Array.isArray(user.twoFactorBackupCodes) && user.twoFactorBackupCodes.length > 0) {
    const backupIndex = user.twoFactorBackupCodes.findIndex(
      (b) => !b.used && b.code && b.code.toUpperCase() === cleanCode.toUpperCase()
    );
    if (backupIndex !== -1) {
      isValid = true;
      isBackupCode = true;
      user.twoFactorBackupCodes[backupIndex].used = true;
    }
  }

  if (!isValid) throw ApiError.unauthorized("Invalid 2FA code or backup code");

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  user.lastLoginIp  = ip;
  await user.save({ validateBeforeSave: false });

  logger.info(`User ${user.email} completed 2FA login (via ${isBackupCode ? "backup code" : "authenticator app"})`);
  return { user, accessToken, refreshToken };
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
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FALogin,
};
