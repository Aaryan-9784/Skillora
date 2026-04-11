const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const clientSchema = new Schema(
  {
    owner:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name:    { type: String, required: true, trim: true, maxlength: 150 },
    email:   { type: String, required: true, lowercase: true, trim: true },
    company: { type: String, trim: true, default: "" },
    phone:   { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    notes:   { type: String, default: "" },
    avatar:  { type: String, default: "" },

    // Denormalized stats — updated via post-save hooks on Project/Invoice
    // Avoids expensive aggregations on every dashboard load
    stats: {
      totalProjects:  { type: Number, default: 0 },
      totalInvoiced:  { type: Number, default: 0 },
      totalPaid:      { type: Number, default: 0 },
    },

    tags:      [{ type: String, trim: true }],
    isActive:  { type: Boolean, default: true },
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
clientSchema.index({ email: 1, owner: 1 }, { unique: true });  // one email per owner
clientSchema.index({ owner: 1, isDeleted: 1 });
clientSchema.index({ name: "text", company: "text" });          // search

// ── Soft delete middleware ────────────────────────────────
clientSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

clientSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = model("Client", clientSchema);
