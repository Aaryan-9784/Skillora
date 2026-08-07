const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const proposalSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "USD",
      maxlength: 3,
    },
    estimatedDays: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "withdrawn"],
      default: "pending",
    },
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

proposalSchema.index({ project: 1, freelancer: 1 }, { unique: true });
proposalSchema.index({ client: 1, status: 1 });
proposalSchema.index({ freelancer: 1, status: 1 });
proposalSchema.index({ createdAt: -1 });

module.exports = model("Proposal", proposalSchema);
