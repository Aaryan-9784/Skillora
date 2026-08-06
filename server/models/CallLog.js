const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const callLogSchema = new Schema(
  {
    caller:          { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver:        { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId:       { type: Schema.Types.ObjectId, ref: "Project" },
    type:            { type: String, enum: ["voice", "video"], required: true },
    status:          { type: String, enum: ["answered", "missed", "rejected"], required: true },
    durationSeconds: { type: Number, default: 0 },
    startedAt:       { type: Date, default: Date.now },
    endedAt:         { type: Date },
  },
  { timestamps: true }
);

callLogSchema.index({ caller: 1, receiver: 1, createdAt: -1 });

module.exports = model("CallLog", callLogSchema);
