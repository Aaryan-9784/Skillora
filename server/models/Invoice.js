const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const lineItemSchema = new Schema({
  description: { type: String, required: true, trim: true },
  quantity:    { type: Number, required: true, min: 0 },
  rate:        { type: Number, required: true, min: 0 },
  amount:      { type: Number, required: true },   // quantity * rate, stored for immutability
}, { _id: true });

const invoiceSchema = new Schema(
  {
    owner:     { type: Schema.Types.ObjectId, ref: "User",    required: true },
    clientId:  { type: Schema.Types.ObjectId, ref: "Client",  required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },

    invoiceNumber: { type: String, required: true, unique: true, trim: true },

    lineItems: { type: [lineItemSchema], validate: [(v) => v.length > 0, "At least one line item required"] },
    subtotal:  { type: Number, required: true, min: 0 },
    taxRate:   { type: Number, default: 0, min: 0, max: 100 },  // percentage
    taxAmount: { type: Number, default: 0 },
    discount:  { type: Number, default: 0, min: 0 },
    total:     { type: Number, required: true, min: 0 },
    currency:  { type: String, default: "USD", maxlength: 3 },

    status: {
      type:    String,
      enum:    ["draft", "sent", "viewed", "paid", "overdue", "cancelled"],
      default: "draft",
    },

    issueDate: { type: Date, default: Date.now },
    dueDate:   { type: Date },
    paidAt:    { type: Date },

    notes:      { type: String, default: "" },
    terms:      { type: String, default: "" },
    paymentUrl: { type: String, default: "" },

    // Soft delete
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────
invoiceSchema.index({ owner: 1, status: 1 });
invoiceSchema.index({ owner: 1, createdAt: -1 });
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ projectId: 1 }, { sparse: true });
invoiceSchema.index({ dueDate: 1 }, { sparse: true });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

// ── Virtual: is overdue ───────────────────────────────────
invoiceSchema.virtual("isOverdue").get(function () {
  return this.dueDate && this.dueDate < new Date() && !["paid","cancelled"].includes(this.status);
});

// ── Pre-save: auto-mark overdue ───────────────────────────
invoiceSchema.pre("save", function (next) {
  if (this.isOverdue && this.status === "sent") {
    this.status = "overdue";
  }
  next();
});

// ── Soft delete middleware ────────────────────────────────
invoiceSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

invoiceSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = model("Invoice", invoiceSchema);
