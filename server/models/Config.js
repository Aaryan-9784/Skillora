const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const configSchema = new Schema(
  {
    key:                 { type: String, required: true, unique: true, default: "global" },
    platformName:        { type: String, default: "Skillora", trim: true },
    supportEmail:        { type: String, default: "support@skillora.app", trim: true, lowercase: true },
    maintenanceMode:     { type: Boolean, default: false },
    allowRegistrations:  { type: Boolean, default: true },
    maxAiRequestsPerDay: { type: Number, default: 50, min: 0 },
    defaultPlan:         { type: String, default: "free" },
  },
  { timestamps: true }
);

module.exports = model("Config", configSchema);
