const asyncHandler   = require("../utils/asyncHandler");
const ApiResponse    = require("../utils/ApiResponse");
const clientService  = require("../services/client.service");
const { inviteClient } = require("../services/clientPortal.service");

const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.user._id, req.body);
  ApiResponse.created(res, "Client created", { client });
});

const getClients = asyncHandler(async (req, res) => {
  const result = await clientService.getClients(req.user._id, req.query);
  ApiResponse.success(res, "Clients fetched", result);
});

const getClient = asyncHandler(async (req, res) => {
  const data = await clientService.getClientWithContext(req.params.id, req.user._id);
  ApiResponse.success(res, "Client fetched", data);
});

const updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.user._id, req.body);
  ApiResponse.success(res, "Client updated", { client });
});

const deleteClient = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req.params.id, req.user._id);
  ApiResponse.success(res, "Client deleted");
});

const getRevenueStats = asyncHandler(async (req, res) => {
  const stats = await clientService.getClientRevenueStats(req.user._id);
  ApiResponse.success(res, "Client revenue stats", { stats });
});

const inviteToPortal = asyncHandler(async (req, res) => {
  const clientUser = await inviteClient(req.params.id, req.user._id);
  ApiResponse.success(res, "Invite sent to client", { clientUser });
});

module.exports = { createClient, getClients, getClient, updateClient, deleteClient, getRevenueStats, inviteToPortal };
