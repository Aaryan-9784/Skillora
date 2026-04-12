const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false, minlength: 8 },
    avatar:   { type: String, default: "" },

    // OAuth
    provider:   { type: String, enum: ["local", "google", "github"], default: "local" },
    providerId: { type: String, default: null },

    // Access control
    role:            { type: String, enum: ["freelancer", "admin"], default: "freelancer" },
    isEmailVerified: { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },

    // SaaS subscription
    plan: {
      type:    String,
      enum:    ["free", "pro", "premium"],
      default: "free",
    },
    subscription: {
      razorpayCustomerId:     { type: String, default: null, select: false },
      razorpaySubscriptionId: { type: String, default: null, select: false },
      status:            { type: String, enum: ["active","trialing","past_due","canceled","none"], default: "none" },
      currentPeriodEnd:  { type: Date,    default: null },
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },

    // Skills (denormalized array of refs for fast profile reads)
    skills: [{ type: Schema.Types.ObjectId, ref: "Skill" }],

    // Preferences (denormalized — avoids extra collection for simple settings)
    preferences: {
      currency:      { type: String, default: "USD" },
      timezone:      { type: String, default: "UTC" },
      notifications: { type: Boolean, default: true },
      theme:         { type: String, enum: ["light", "dark", "system"], default: "system" },
    },

    // Token management
    refreshToken:  { type: String, select: false, default: null },
    tokenVersion:  { type: Number, default: 0, select: false },

    // Security tracking
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil:     { type: Date, select: false },
    lastLogin:     { type: Date },
    lastLoginIp:   { type: String, default: "" },

    // Password reset
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // Soft delete
    isDeleted:  { type: Boolean, default: false, select: false },
    deletedAt:  { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────
// email index is already created by unique:true on the field definition
userSchema.index({ provider: 1, providerId: 1 });
userSchema.index({ name: "text" });
userSchema.index({ isDeleted: 1, isActive: 1 });

// ── Virtual: account locked ───────────────────────────────
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Pre-save: hash password ───────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Pre-find: exclude soft-deleted by default ─────────────
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// ── Instance methods ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

const MAX_ATTEMPTS = 5;
const LOCK_TIME    = 30 * 60 * 1000;

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
};

userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive  = false;
  return this.save({ validateBeforeSave: false });
};

// ── toJSON: strip all sensitive fields ────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: false });
  const STRIP = ["password","refreshToken","tokenVersion","loginAttempts",
                 "lockUntil","passwordResetToken","passwordResetExpires",
                 "isDeleted","deletedAt",
                 "subscription.razorpayCustomerId","subscription.razorpaySubscriptionId"];
  STRIP.forEach((k) => {
    const parts = k.split(".");
    if (parts.length === 2) { if (obj[parts[0]]) delete obj[parts[0]][parts[1]]; }
    else delete obj[k];
  });
  return obj;
};

module.exports = model("User", userSchema);
