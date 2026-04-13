const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: [
        "project_created", "project_updated", "project_completed",
        "task_assigned", "task_due_soon", "task_overdue",
        "invoice_sent", "invoice_paid", "invoice_overdue",
        "payment_received",
        "ai_suggestion",
        "system",
        // Cross-dashboard sync events
        "invoice_viewed",
        "client_portal_joined",
        "plan_changed",
        "account_deactivated",
        "project_status_changed",
      ],
      required: true,
    },

    title:   { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },

    // Optional deep-link to the relevant resource
    link: { type: String, default: "" },

    // Reference to the triggering resource (polymorphic-style)
    refModel: { type: String, enum: ["Project", "Task", "Invoice", "Payment", null], default: null },
    refId:    { type: Schema.Types.ObjectId, default: null },

    read:    { type: Boolean, default: false },
    readAt:  { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ── Instance: mark as read ────────────────────────────────
notificationSchema.methods.markRead = function () {
  this.read   = true;
  this.readAt = new Date();
  return this.save();
};

// ── Static: mark all as read for a user ──────────────────
notificationSchema.statics.markAllRead = function (userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

module.exports = model("Notification", notificationSchema);
