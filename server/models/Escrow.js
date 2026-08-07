const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const escrowSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "USD",
      maxlength: 3,
    },
    commissionPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "funded", "released", "refunded", "disputed"],
      default: "pending",
    },
    fundedAt: { type: Date },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

escrowSchema.index({ project: 1 });
escrowSchema.index({ client: 1, status: 1 });
escrowSchema.index({ freelancer: 1, status: 1 });

module.exports = model("Escrow", escrowSchema);
