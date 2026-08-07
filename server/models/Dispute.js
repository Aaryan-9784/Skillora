const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const disputeSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    evidence: [
      {
        name: String,
        url: String,
      },
    ],
    status: {
      type: String,
      enum: ["open", "under_review", "resolved_refund", "resolved_release", "closed"],
      default: "open",
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

disputeSchema.index({ project: 1 });
disputeSchema.index({ status: 1, createdAt: -1 });

module.exports = model("Dispute", disputeSchema);
