const asyncHandler    = require("../utils/asyncHandler");
const ApiResponse     = require("../utils/ApiResponse");
const invoiceService  = require("../services/invoice.service");

const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.user._id, req.body);
  ApiResponse.created(res, "Invoice created", { invoice });
});

const getInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.getInvoices(req.user._id, req.query);
  ApiResponse.success(res, "Invoices fetched", result);
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id, req.user._id);
  ApiResponse.success(res, "Invoice fetched", { invoice });
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.user._id, req.body);
  ApiResponse.success(res, "Invoice updated", { invoice });
});

const deleteInvoice = asyncHandler(async (req, res) => {
  await invoiceService.deleteInvoice(req.params.id, req.user._id);
  ApiResponse.success(res, "Invoice deleted");
});

const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months, 10) || 12;
  const data   = await invoiceService.getRevenueAnalytics(req.user._id, months);
  ApiResponse.success(res, "Revenue analytics", { data });
});

const getOutstandingBalance = asyncHandler(async (req, res) => {
  const balance = await invoiceService.getOutstandingBalance(req.user._id);
  ApiResponse.success(res, "Outstanding balance", { balance });
});

module.exports = {
  createInvoice, getInvoices, getInvoice, updateInvoice, deleteInvoice,
  getRevenueAnalytics, getOutstandingBalance,
};
