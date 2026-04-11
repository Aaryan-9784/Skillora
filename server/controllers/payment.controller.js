const asyncHandler    = require("../utils/asyncHandler");
const ApiResponse     = require("../utils/ApiResponse");
const paymentService  = require("../services/payment.service");

const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment(req.user._id, req.body);
  ApiResponse.created(res, "Payment recorded", { payment });
});

const getPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.getPayments(req.user._id, req.query);
  ApiResponse.success(res, "Payments fetched", result);
});

const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id, req.user._id);
  ApiResponse.success(res, "Payment fetched", { payment });
});

const updatePayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.updatePayment(req.params.id, req.user._id, req.body);
  ApiResponse.success(res, "Payment updated", { payment });
});

const getEarningsSummary = asyncHandler(async (req, res) => {
  const summary = await paymentService.getEarningsSummary(req.user._id);
  ApiResponse.success(res, "Earnings summary", { summary });
});

module.exports = { createPayment, getPayments, getPayment, updatePayment, getEarningsSummary };
