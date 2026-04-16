const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    sender:    { type: Schema.Types.ObjectId, ref: "User",    required: true },
    content:   { type: String, required: true, trim: true, maxlength: 5000 },
    readBy:    [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.index({ projectId: 1, createdAt: -1 });

module.exports = model("Message", messageSchema);
