const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const attachmentSchema = new Schema({
  url:       { type: String, required: true },
  fileName:  { type: String, required: true },
  fileType:  { type: String, enum: ["image", "pdf", "zip", "document", "audio"], required: true },
  sizeBytes: { type: Number, default: 0 },
  duration:  { type: Number }, // Audio duration in seconds
});

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "media", "voice_note", "system_event"],
      default: "text",
    },
    content:     { type: String, trim: true, default: "" },
    attachments: [attachmentSchema],
    readBy: [
      {
        user:   { type: Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = model("Message", messageSchema);
