const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "project"],
      default: "project",
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      text:      { type: String, default: "" },
      sender:    { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ projectId: 1 }, { unique: true, sparse: true });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = model("Conversation", conversationSchema);
