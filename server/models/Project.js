const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const projectSchema = new Schema(
  {
    owner:    { type: Schema.Types.ObjectId, ref: "User",   required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },

    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 5000 },
    status: {
      type:    String,
      enum:    ["planning", "active", "on_hold", "completed", "cancelled"],
      default: "planning",
    },

    // Financials
    budget:   { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD", maxlength: 3 },

    // Timeline
    startDate: { type: Date },
    deadline:  { type: Date },

    // Progress — denormalized from tasks for fast reads
    progress: { type: Number, default: 0, min: 0, max: 100 },

    // Denormalized task counters — updated by Task post-save hooks
    taskStats: {
      total:       { type: Number, default: 0 },
      todo:        { type: Number, default: 0 },
      in_progress: { type: Number, default: 0 },
      review:      { type: Number, default: 0 },
      done:        { type: Number, default: 0 },
    },

    tags:        [{ type: String, trim: true, maxlength: 50 }],
    attachments: [{ name: String, url: String, uploadedAt: Date }],

    // Soft delete
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ clientId: 1 });
projectSchema.index({ owner: 1, isDeleted: 1 });
projectSchema.index({ title: "text", description: "text" });
projectSchema.index({ deadline: 1 }, { sparse: true });

// ── Soft delete middleware ────────────────────────────────
projectSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// ── Virtual: is overdue ───────────────────────────────────
projectSchema.virtual("isOverdue").get(function () {
  return this.deadline && this.deadline < new Date() && this.status !== "completed";
});

projectSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save({ validateBeforeSave: false });
};

/**
 * Recalculate progress from taskStats.
 * Called after task status changes.
 */
projectSchema.methods.recalculateProgress = function () {
  const { total, done } = this.taskStats;
  this.progress = total > 0 ? Math.round((done / total) * 100) : 0;
  return this.save({ validateBeforeSave: false });
};

module.exports = model("Project", projectSchema);
