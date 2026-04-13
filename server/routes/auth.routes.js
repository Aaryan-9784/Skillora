const router   = require("express").Router();
const passport = require("../config/passport");
const {
  register, login, refresh, logout, logoutAll, me,
  forgotPassword, resetPassword,
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

// ── Password reset ────────────────────────────────────────
router.post("/forgot-password", authLimiter, validateForgotPassword, forgotPassword);
router.post("/reset-password/:token", authLimiter, validateResetPassword, resetPassword);

// ── Google OAuth ──────────────────────────────────────────
router.get("/google", (req, res, next) => {
  const role = ["freelancer", "client"].includes(req.query.role) ? req.query.role : "freelancer";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: role,
  })(req, res, next);
});
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`, session: false }),
  googleCallback
);

// ── GitHub OAuth ──────────────────────────────────────────
router.get("/github", (req, res, next) => {
  const role = ["freelancer", "client"].includes(req.query.role) ? req.query.role : "freelancer";
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
    state: role,
  })(req, res, next);
});
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: `${process.env.CLIENT_URL}/login?error=github_failed`, session: false }),
  githubCallback
);

module.exports = router;
