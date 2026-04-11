const passport    = require("passport");
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
  const { user, accessToken, refreshToken } = await authService.login({ ...req.body, ip });
  authService.setTokenCookies(res, accessToken, refreshToken);
  ApiResponse.success(res, "Login successful", { user, accessToken });
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

  const resetToken = await authService.createPasswordResetToken(email);

  // In production: send email with resetToken
  // For now we return it in dev only
  const data = process.env.NODE_ENV === "development" ? { resetToken } : {};
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

const googleCallback  = oauthCallback("google");
const githubCallback  = oauthCallback("github");

module.exports = {
  register, login, refresh, logout, logoutAll, me,
  forgotPassword, resetPassword,
  googleCallback, githubCallback,
};
