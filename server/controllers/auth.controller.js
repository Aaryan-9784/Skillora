const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const authService  = require("../services/auth.service");

// ── Local auth ────────────────────────────────────────────

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  authService.setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.created(res, "Account created successfully", { user, accessToken });
});

const login = asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "";
  const result = await authService.login({ ...req.body, ip });

  if (result.require2FA) {
    return ApiResponse.success(res, "2FA authentication required", {
      require2FA: true,
      mfaToken: result.mfaToken,
    });
  }

  authService.setTokenCookies(res, result.accessToken, result.refreshToken);
  ApiResponse.success(res, "Login successful", { user: result.user, accessToken: result.accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAccessToken(token);
  authService.setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, "Token refreshed", { accessToken });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  authService.clearTokenCookies(res);
  ApiResponse.success(res, "Logged out successfully");
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user._id);
  authService.clearTokenCookies(res);
  ApiResponse.success(res, "Logged out from all devices");
});

const me = asyncHandler(async (req, res) => {
  ApiResponse.success(res, "User fetched", { user: req.user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest("Email is required");

  const result = await authService.createPasswordResetToken(email);
  if (result) {
    const { user, resetToken } = result;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl  = `${clientUrl}/reset-password/${resetToken}`;
    const emailService = require("../services/email.service");
    await emailService.sendPasswordReset(user, resetUrl);
  }

  const data = process.env.NODE_ENV === "development" && result ? { resetToken: result.resetToken } : {};
  ApiResponse.success(res, "If that email exists, a reset link has been sent.", data);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) throw ApiError.badRequest("New password is required");

  await authService.resetPassword(token, password);
  ApiResponse.success(res, "Password reset successfully. Please log in.");
});

// ── OAuth callbacks ───────────────────────────────────────

/**
 * Generic OAuth callback handler — used by both Google and GitHub.
 * Passport has already authenticated the user and attached it to req.user.
 */
const oauthCallback = (provider) =>
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=oauth_failed&provider=${provider}`
      );
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || "";
    const { accessToken, refreshToken } = await authService.oauthLogin(req.user, ip);
    authService.setTokenCookies(res, accessToken, refreshToken);

    // Redirect to frontend with access token in URL fragment (never in query string)
    // Frontend reads it once, stores in memory, then removes from URL
    res.redirect(`${process.env.CLIENT_URL}/oauth/callback#token=${accessToken}`);
  });

const setup2FA = asyncHandler(async (req, res) => {
  const data = await authService.setup2FA(req.user._id);
  ApiResponse.success(res, "2FA setup initiated", data);
});

const enable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest("Verification token is required");
  const data = await authService.enable2FA(req.user._id, token);
  ApiResponse.success(res, "2FA enabled successfully", data);
});

const disable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest("Verification token is required");
  await authService.disable2FA(req.user._id, token);
  ApiResponse.success(res, "2FA disabled successfully");
});

const verify2FALogin = asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "";
  const { mfaToken, code } = req.body;
  const { user, accessToken, refreshToken } = await authService.verify2FALogin({ mfaToken, code, ip });
  authService.setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, "2FA verification successful", { user, accessToken });
});

const googleCallback  = oauthCallback("google");
const githubCallback  = oauthCallback("github");

module.exports = {
  register, login, refresh, logout, logoutAll, me,
  forgotPassword, resetPassword,
  setup2FA, enable2FA, disable2FA, verify2FALogin,
  googleCallback, githubCallback,
};
