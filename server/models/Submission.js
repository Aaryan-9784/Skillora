const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const submissionSchema = new Schema(
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
    title: {
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
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["submitted", "revision_requested", "approved", "rejected"],
      default: "submitted",
    },
    clientFeedback: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

submissionSchema.index({ project: 1, createdAt: -1 });

module.exports = model("Submission", submissionSchema);
