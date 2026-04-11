const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const paymentSchema = new Schema(
  {
    owner:     { type: Schema.Types.ObjectId, ref: "User",    required: true },
    clientId:  { type: Schema.Types.ObjectId, ref: "Client",  required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },

    amount:   { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", maxlength: 3 },

    status: {
      type:    String,
      enum:    ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "paypal", "stripe", "crypto", "cash", "check", "other"],
      default: "other",
    },

    transactionId: { type: String, trim: true, default: "" },
    notes:         { type: String, default: "" },
    paidAt:        { type: Date },

    // Soft delete
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
paymentSchema.index({ owner: 1, status: 1 });
paymentSchema.index({ owner: 1, createdAt: -1 });
paymentSchema.index({ projectId: 1 }, { sparse: true });
paymentSchema.index({ invoiceId: 1 }, { sparse: true });
paymentSchema.index({ clientId: 1 });

// ── Soft delete middleware ────────────────────────────────
paymentSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// ── Post-save: mark invoice as paid when payment completes ─
paymentSchema.post("save", async function () {
  if (this.status === "completed" && this.invoiceId) {
    await mongoose.model("Invoice").findByIdAndUpdate(this.invoiceId, {
      status: "paid",
      paidAt: this.paidAt || new Date(),
    });
  }
});

module.exports = model("Payment", paymentSchema);
