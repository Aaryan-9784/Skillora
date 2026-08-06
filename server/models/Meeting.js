const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const meetingSchema = new Schema(
  {
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: "" },
    projectId:    { type: Schema.Types.ObjectId, ref: "Project", required: true },
    organizer:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    scheduledAt:  { type: Date, required: true, index: true },
    durationMins: { type: Number, default: 30 },
    roomLink:     { type: String, required: true },
    status:       { type: String, enum: ["scheduled", "ongoing", "completed", "cancelled"], default: "scheduled" },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

meetingSchema.index({ projectId: 1, scheduledAt: 1 });
meetingSchema.index({ status: 1, scheduledAt: 1, reminderSent: 1 });

module.exports = model("Meeting", meetingSchema);
