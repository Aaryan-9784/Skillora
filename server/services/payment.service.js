const Payment      = require("../models/Payment");
const ApiError     = require("../utils/ApiError");
const QueryBuilder = require("../utils/queryBuilder");
const notify       = require("../utils/notify");

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

/**
 * Total earnings aggregation — grouped by currency.
 */
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

module.exports = { createPayment, getPayments, getPaymentById, updatePayment, getEarningsSummary };
