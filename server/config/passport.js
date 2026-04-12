const passport      = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User   = require("../models/User");
const logger = require("../utils/logger");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

const findOrCreateOAuthUser = async (provider, profile, email, name, avatar) => {
  let user = await User.findOne({ provider, providerId: profile.id });
  if (user) return user;

  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user.provider    = provider;
      user.providerId  = profile.id;
      if (!user.avatar && avatar) user.avatar = avatar;
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
      return user;
    }
  }

  user = await User.create({
    name,
    email:    email || `${provider}_${profile.id}@skillora.app`,
    avatar,
    provider,
    providerId:      profile.id,
    isEmailVerified: true,
  });
  return user;
};

// ── Google ────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // MUST be absolute — relative URLs cause Google to redirect to the
        // frontend origin (localhost:5173) instead of the Express server (localhost:5000)
        callbackURL:  `${SERVER_URL}/api/auth/google/callback`,
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

// ── GitHub ────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID:     process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:  `${SERVER_URL}/api/auth/github/callback`,
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
