const Client       = require("../models/Client");
const Project      = require("../models/Project");
const Invoice      = require("../models/Invoice");
const ApiError     = require("../utils/ApiError");
const QueryBuilder = require("../utils/queryBuilder");

const createClient = async (ownerId, data) => {
  return Client.create({ ...data, owner: ownerId });
};

const getClients = async (ownerId, reqQuery = {}) => {
  const baseQuery = Client.find({ owner: ownerId });
  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .search(["name", "company", "email"])
    .sort("-createdAt")
    .paginate(20)
    .lean()
    .exec();
};

const getClientById = async (clientId, ownerId) => {
  const client = await Client.findOne({ _id: clientId, owner: ownerId }).lean();
  if (!client) throw ApiError.notFound("Client not found");
  return client;
};

/**
 * Get client with full context: projects + invoices.
 * Uses Promise.all for parallel fetching.
 */
const getClientWithContext = async (clientId, ownerId) => {
  const [client, projects, invoices] = await Promise.all([
    Client.findOne({ _id: clientId, owner: ownerId }).lean(),
    Project.find({ clientId, owner: ownerId }).select("title status budget deadline progress").lean(),
    Invoice.find({ clientId, owner: ownerId }).select("invoiceNumber total status dueDate").lean(),
  ]);

  if (!client) throw ApiError.notFound("Client not found");
  return { client, projects, invoices };
};

const updateClient = async (clientId, ownerId, updates) => {
  const client = await Client.findOneAndUpdate(
    { _id: clientId, owner: ownerId },
    updates,
    { new: true, runValidators: true }
  );
  if (!client) throw ApiError.notFound("Client not found");
  return client;
};

const deleteClient = async (clientId, ownerId) => {
  const client = await Client.findOne({ _id: clientId, owner: ownerId });
  if (!client) throw ApiError.notFound("Client not found");
  await client.softDelete();
  return true;
};

/**
 * Revenue breakdown per client — aggregation pipeline.
 */
const getClientRevenueStats = async (ownerId) => {
  return Invoice.aggregate([
    { $match: { owner: ownerId, status: "paid", isDeleted: { $ne: true } } },
    {
      $group: {
        _id:          "$clientId",
        totalRevenue: { $sum: "$total" },
        invoiceCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from:         "clients",
        localField:   "_id",
        foreignField: "_id",
        as:           "client",
      },
    },
    { $unwind: "$client" },
    {
      $project: {
        clientName:   "$client.name",
        clientEmail:  "$client.email",
        totalRevenue: 1,
        invoiceCount: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 },
  ]);
};

module.exports = {
  createClient, getClients, getClientById, getClientWithContext,
  updateClient, deleteClient, getClientRevenueStats,
};
