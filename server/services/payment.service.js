const Razorpay   = require("razorpay");
const crypto     = require("crypto");
const Payment    = require("../models/Payment");
const Invoice    = require("../models/Invoice");
const ApiError   = require("../utils/ApiError");
const QueryBuilder = require("../utils/queryBuilder");
const notify     = require("../utils/notify");

const getRazorpayInstance = () => {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw ApiError.badRequest("Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) not configured in server environment.");
  }
  return new Razorpay({ key_id, key_secret });
};

const createRazorpayOrder = async (userId, { amount, currency = "INR", invoiceId, notes = {} }) => {
  const razorpay = getRazorpayInstance();

  let finalAmount = Number(amount);
  if (invoiceId) {
    const inv = await Invoice.findById(invoiceId);
    if (inv) {
      finalAmount = inv.total;
      currency    = inv.currency || "INR";
    }
  }

  if (!finalAmount || finalAmount <= 0) {
    throw ApiError.badRequest("Invalid payment amount for Razorpay order");
  }

  // Razorpay expects amount in paise / cents
  const amountInPaise = Math.round(finalAmount * 100);

  const options = {
    amount:   amountInPaise,
    currency: currency.toUpperCase() === "USD" ? "USD" : "INR",
    receipt:  `rcpt_${invoiceId || Date.now()}`,
    notes:    { invoiceId: invoiceId || "", userId: userId.toString(), ...notes },
  };

  const order = await razorpay.orders.create(options);
  return {
    keyId:    process.env.RAZORPAY_KEY_ID,
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
  };
};

const verifyRazorpayPayment = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, amount, currency = "INR" }) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw ApiError.badRequest("Missing required Razorpay payment verification parameters.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw ApiError.badRequest("Razorpay payment signature verification failed.");
  }

  let inv = null;
  if (invoiceId) {
    inv = await Invoice.findById(invoiceId);
    if (inv) {
      inv.status = "paid";
      inv.paidAt = new Date();
      await inv.save();
    }
  }

  const paymentObj = await Payment.create({
    owner:         inv ? inv.owner : userId,
    clientId:      inv ? inv.clientId : undefined,
    projectId:     inv ? inv.projectId : undefined,
    invoiceId:     invoiceId || undefined,
    amount:        inv ? inv.total : Number(amount),
    currency:      inv ? inv.currency : currency,
    status:        "completed",
    paymentMethod: "razorpay",
    transactionId: razorpay_payment_id,
    paidAt:        new Date(),
  });

  await notify({
    recipient: inv ? inv.owner : userId,
    type:      "payment_received",
    title:     "Razorpay Payment Verified 🎉",
    message:   `Razorpay payment of ${paymentObj.currency} ${paymentObj.amount} was verified successfully. Txn ID: ${razorpay_payment_id}`,
    refModel:  "Payment",
    refId:     paymentObj._id,
  });

  return { payment: paymentObj, invoice: inv };
};

const createPayment = async (ownerId, data) => {
  const payment = await Payment.create({
    ...data,
    owner:  ownerId,
    paidAt: data.status === "completed" ? new Date() : undefined,
  });

  if (payment.status === "completed") {
    await notify({
      recipient: ownerId,
      type:      "payment_received",
      title:     "Payment received",
      message:   `Payment of ${payment.currency} ${payment.amount} received.`,
      refModel:  "Payment",
      refId:     payment._id,
    });
  }

  return payment;
};

const getPayments = async (ownerId, reqQuery = {}) => {
  const baseQuery = Payment.find({ owner: ownerId });
  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .sort("-createdAt")
    .paginate(20)
    .lean()
    .populate("clientId",  "name email company")
    .populate("projectId", "title")
    .populate("invoiceId", "invoiceNumber total")
    .exec();
};

const getPaymentById = async (paymentId, ownerId) => {
  const payment = await Payment.findOne({ _id: paymentId, owner: ownerId })
    .populate("clientId",  "name email company")
    .populate("projectId", "title")
    .populate("invoiceId", "invoiceNumber total")
    .lean();
  if (!payment) throw ApiError.notFound("Payment not found");
  return payment;
};

const updatePayment = async (paymentId, ownerId, updates) => {
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, owner: ownerId },
    updates,
    { new: true, runValidators: true }
  );
  if (!payment) throw ApiError.notFound("Payment not found");
  return payment;
};

const getEarningsSummary = async (ownerId) => {
  return Payment.aggregate([
    { $match: { owner: ownerId, status: "completed", isDeleted: { $ne: true } } },
    {
      $group: {
        _id:          "$currency",
        totalEarned:  { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
    { $sort: { totalEarned: -1 } },
  ]);
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  getEarningsSummary,
};
