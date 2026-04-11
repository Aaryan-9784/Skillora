const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const aiLogSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // What triggered this AI call
    feature: {
      type: String,
      enum: ["task_suggestion", "project_description", "invoice_summary", "chat", "other"],
      default: "chat",
    },

    // Optional context references
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },

    prompt:   { type: String, required: true, maxlength: 10000 },
    response: { type: String, required: true, maxlength: 20000 },

    // Token usage for cost tracking
    tokensUsed: {
      prompt:     { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total:      { type: Number, default: 0 },
    },

    model:      { type: String, default: "gemini-1.5-pro" },
    durationMs: { type: Number, default: 0 },  // latency tracking

    // User feedback on AI response
    feedback: {
      rating:  { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
aiLogSchema.index({ owner: 1, createdAt: -1 });
aiLogSchema.index({ owner: 1, feature: 1 });
// TTL: auto-delete AI logs older than 180 days
aiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = model("AiLog", aiLogSchema);
