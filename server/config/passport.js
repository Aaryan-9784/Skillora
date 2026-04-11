const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * Find or create a user from an OAuth profile.
 * Handles account merging when the same email already exists locally.
 */
const findOrCreateOAuthUser = async (provider, profile, email, name, avatar) => {
  // 1. Try to find by provider + providerId
  let user = await User.findOne({ provider, providerId: profile.id });
  if (user) return user;

  // 2. Try to find by email (merge with existing local account)
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      // Link OAuth to existing account
      user.provider   = provider;
      user.providerId = profile.id;
      if (!user.avatar && avatar) user.avatar = avatar;
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
      return user;
    }
  }

  // 3. Create new OAuth user
  user = await User.create({
    name,
    email: email || `${provider}_${profile.id}@skillora.app`,
    avatar,
    provider,
    providerId: profile.id,
    isEmailVerified: true,
  });

  return user;
};

// ── Google Strategy ───────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  "/api/auth/google/callback",
        scope:        ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email  = profile.emails?.[0]?.value;
          const name   = profile.displayName || profile.name?.givenName || "Google User";
          const avatar = profile.photos?.[0]?.value;
          const user   = await findOrCreateOAuthUser("google", profile, email, name, avatar);
          return done(null, user);
        } catch (err) {
          logger.error(`Google OAuth error: ${err.message}`);
          return done(err, null);
        }
      }
    )
  );
}

// ── GitHub Strategy ───────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID:     process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:  "/api/auth/github/callback",
        scope:        ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email  = profile.emails?.[0]?.value;
          const name   = profile.displayName || profile.username || "GitHub User";
          const avatar = profile.photos?.[0]?.value;
          const user   = await findOrCreateOAuthUser("github", profile, email, name, avatar);
          return done(null, user);
        } catch (err) {
          logger.error(`GitHub OAuth error: ${err.message}`);
          return done(err, null);
        }
      }
    )
  );
}

// Passport does not use sessions — we handle tokens ourselves
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
