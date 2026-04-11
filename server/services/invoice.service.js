const Invoice      = require("../models/Invoice");
const Client       = require("../models/Client");
const ApiError     = require("../utils/ApiError");
const QueryBuilder = require("../utils/queryBuilder");
const notify       = require("../utils/notify");

/**
 * Auto-generate invoice number: INV-YYYYMM-XXXX
 */
const generateInvoiceNumber = async (ownerId) => {
  const now    = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count  = await Invoice.countDocuments({ owner: ownerId });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

const createInvoice = async (ownerId, data) => {
  const invoiceNumber = await generateInvoiceNumber(ownerId);

  // Calculate totals server-side — never trust client math
  const lineItems = data.lineItems.map((item) => ({
    ...item,
    amount: parseFloat((item.quantity * item.rate).toFixed(2)),
  }));
  const subtotal  = parseFloat(lineItems.reduce((s, i) => s + i.amount, 0).toFixed(2));
  const taxAmount = parseFloat(((subtotal * (data.taxRate || 0)) / 100).toFixed(2));
  const discount  = parseFloat((data.discount || 0).toFixed(2));
  const total     = parseFloat((subtotal + taxAmount - discount).toFixed(2));

  const invoice = await Invoice.create({
    ...data,
    owner: ownerId,
    invoiceNumber,
    lineItems,
    subtotal,
    taxAmount,
    total,
  });

  // Update client stats
  await Client.findByIdAndUpdate(data.clientId, {
    $inc: { "stats.totalInvoiced": total },
  });

  return invoice;
};

const getInvoices = async (ownerId, reqQuery = {}) => {
  const baseQuery = Invoice.find({ owner: ownerId });
  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .sort("-createdAt")
    .paginate(20)
    .lean()
    .populate("clientId",  "name email company")
    .populate("projectId", "title")
    .exec();
};

const getInvoiceById = async (invoiceId, ownerId) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, owner: ownerId })
    .populate("clientId",  "name email company phone address")
    .populate("projectId", "title")
    .lean({ virtuals: true });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  return invoice;
};

const updateInvoice = async (invoiceId, ownerId, updates) => {
  // Prevent editing paid/cancelled invoices
  const existing = await Invoice.findOne({ _id: invoiceId, owner: ownerId });
  if (!existing) throw ApiError.notFound("Invoice not found");
  if (["paid", "cancelled"].includes(existing.status)) {
    throw ApiError.badRequest(`Cannot edit a ${existing.status} invoice`);
  }

  const invoice = await Invoice.findByIdAndUpdate(invoiceId, updates, {
    new: true, runValidators: true,
  });

  if (updates.status === "sent") {
    await notify({
      recipient: ownerId,
      type:      "invoice_sent",
      title:     "Invoice sent",
      message:   `Invoice ${invoice.invoiceNumber} has been sent.`,
      refModel:  "Invoice",
      refId:     invoice._id,
    });
  }

  return invoice;
};

const deleteInvoice = async (invoiceId, ownerId) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, owner: ownerId });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === "paid") throw ApiError.badRequest("Cannot delete a paid invoice");
  await invoice.softDelete();
  return true;
};

/**
 * Revenue analytics — monthly breakdown for the last N months.
 */
const getRevenueAnalytics = async (ownerId, months = 12) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return Invoice.aggregate([
    {
      $match: {
        owner:     ownerId,
        status:    "paid",
        paidAt:    { $gte: since },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: {
          year:  { $year:  "$paidAt" },
          month: { $month: "$paidAt" },
        },
        revenue:      { $sum: "$total" },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id:          0,
        year:         "$_id.year",
        month:        "$_id.month",
        revenue:      1,
        invoiceCount: 1,
      },
    },
  ]);
};

/**
 * Outstanding balance — sum of all unpaid invoices.
 */
const getOutstandingBalance = async (ownerId) => {
  const [result] = await Invoice.aggregate([
    {
      $match: {
        owner:     ownerId,
        status:    { $in: ["sent", "overdue"] },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id:         null,
        outstanding: { $sum: "$total" },
        count:       { $sum: 1 },
        overdue:     { $sum: { $cond: [{ $eq: ["$status", "overdue"] }, "$total", 0] } },
      },
    },
  ]);
  return result || { outstanding: 0, count: 0, overdue: 0 };
};

module.exports = {
  createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice,
  getRevenueAnalytics, getOutstandingBalance,
};
