const router   = require("express").Router();
const passport = require("../config/passport");
const {
  register, login, refresh, logout, logoutAll, me,
  forgotPassword, resetPassword,
  setup2FA, enable2FA, disable2FA, verify2FALogin,
  googleCallback, githubCallback,
} = require("../controllers/auth.controller");
const {
  validateRegister, validateLogin,
  validateForgotPassword, validateResetPassword,
} = require("../validators/auth.validator");
const { protect }    = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimiter");

// ── Local auth ────────────────────────────────────────────
router.post("/register",  authLimiter, validateRegister, register);
router.post("/login",     authLimiter, validateLogin,    login);
router.post("/refresh",   refresh);
router.post("/logout",    protect, logout);
router.post("/logout-all", protect, logoutAll);
router.get("/me",         protect, me);

// ── 2FA Routes ────────────────────────────────────────────
router.post("/2fa/setup",        protect, setup2FA);
router.post("/2fa/enable",       protect, enable2FA);
router.post("/2fa/disable",      protect, disable2FA);
router.post("/2fa/verify-login", authLimiter, verify2FALogin);

// ── Password reset ────────────────────────────────────────
router.post("/forgot-password", authLimiter, validateForgotPassword, forgotPassword);
router.post("/reset-password/:token", authLimiter, validateResetPassword, resetPassword);

// ── Google OAuth ──────────────────────────────────────────
router.get("/google", (req, res, next) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  const role = ["freelancer", "client"].includes(req.query.role) ? req.query.role : "freelancer";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: role,
  })(req, res, next);
});
router.get(
  "/google/callback",
  (req, res, next) => {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    passport.authenticate("google", {
      failureRedirect: `${clientUrl}/login?error=google_failed`,
      session: false,
    })(req, res, next);
  },
  googleCallback
);

// ── GitHub OAuth ──────────────────────────────────────────
router.get("/github", (req, res, next) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=github_not_configured`);
  }
  const role = ["freelancer", "client"].includes(req.query.role) ? req.query.role : "freelancer";
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
    state: role,
  })(req, res, next);
});
router.get(
  "/github/callback",
  (req, res, next) => {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    passport.authenticate("github", {
      failureRedirect: `${clientUrl}/login?error=github_failed`,
      session: false,
    })(req, res, next);
  },
  githubCallback
);

module.exports = router;
