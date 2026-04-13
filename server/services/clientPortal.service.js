const crypto  = require("crypto");
const User    = require("../models/User");
const Client  = require("../models/Client");
const ApiError = require("../utils/ApiError");
const authService = require("./auth.service");

const inviteClient = async (clientId, freelancerId) => {
  const client = await Client.findOne({ _id: clientId, owner: freelancerId });
  if (!client) throw ApiError.notFound("Client not found");

  // If client user already exists but hasn't activated yet, allow re-invite
  const existing = await User.findOne({ clientRef: clientId, role: "client" })
    .select("+passwordResetToken +passwordResetExpires +isEmailVerified");

  if (existing) {
    // Already activated — don't allow re-invite
    if (existing.isEmailVerified && !existing.passwordResetToken) {
      throw ApiError.conflict("Client already has portal access and has activated their account");
    }
    // Not yet activated — refresh the invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const tokenHash   = crypto.createHash("sha256").update(inviteToken).digest("hex");

    existing.passwordResetToken   = tokenHash;
    existing.passwordResetExpires = Date.now() + 48 * 60 * 60 * 1000;
    await existing.save({ validateBeforeSave: false });

    const emailService = require("./email.service");
    emailService.sendClientInvite(client, inviteToken);
    return existing;
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const tokenHash   = crypto.createHash("sha256").update(inviteToken).digest("hex");

  const clientUser = await User.create({
    name:          client.name,
    email:         client.email,
    role:          "client",
    clientRef:     client._id,
    freelancerRef: freelancerId,
    isEmailVerified: false,
    provider:      "local",
    passwordResetToken:   tokenHash,
    passwordResetExpires: Date.now() + 48 * 60 * 60 * 1000,
  });

  const emailService = require("./email.service");
  emailService.sendClientInvite(client, inviteToken);

  return clientUser;
};

const acceptInvite = async (token, password) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  // Debug: log the hash being searched
  const logger = require("../utils/logger");
  logger.info(`[acceptInvite] token hash: ${hashed}`);

  const user = await User.findOne({
    role:                 "client",
    passwordResetToken:   hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires +password");

  if (!user) {
    // Debug: check if user exists without expiry check
    const anyUser = await User.findOne({ role: "client", passwordResetToken: hashed })
      .select("+passwordResetToken +passwordResetExpires");
    if (anyUser) {
      logger.warn(`[acceptInvite] Token found but EXPIRED. Expires: ${anyUser.passwordResetExpires}, Now: ${new Date()}`);
    } else {
      logger.warn(`[acceptInvite] No user found with this token hash`);
    }
    throw ApiError.badRequest("Invite link is invalid or has expired");
  }

  user.password             = password;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.isEmailVerified      = true;
  await user.save();

  const tokens = authService.generateTokens(user);
  return { ...tokens, user };
};

const clientLogin = async ({ email, password, ip = "" }) => {
  const user = await User.findOne({ email, role: "client" })
    .select("+password +refreshToken +loginAttempts +lockUntil");

  if (!user) throw ApiError.unauthorized("Invalid email or password");

  if (user.isLocked) {
    const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw ApiError.unauthorized(`Account locked. Try again in ${mins} minute(s).`);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw ApiError.unauthorized("Invalid email or password");
  }

  await user.resetLoginAttempts();

  const { accessToken, refreshToken } = authService.generateTokens(user);
  user.refreshToken = refreshToken;
  user.lastLogin    = new Date();
  user.lastLoginIp  = ip;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

module.exports = { inviteClient, acceptInvite, clientLogin };
