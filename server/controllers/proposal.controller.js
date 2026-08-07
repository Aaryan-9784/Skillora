const asyncHandler    = require("../utils/asyncHandler");
const ApiResponse     = require("../utils/ApiResponse");
const proposalService = require("../services/proposal.service");

// Client posts a project
const postClientProject = asyncHandler(async (req, res) => {
  const project = await proposalService.postClientProject(req.user, req.body);
  ApiResponse.created(res, "Project posted for proposals", { project });
});

// Freelancer gets open marketplace projects
const getOpenProjects = asyncHandler(async (req, res) => {
  const result = await proposalService.getOpenProjects(req.query);
  ApiResponse.success(res, "Marketplace projects fetched", result);
});

// Freelancer submits proposal
const submitProposal = asyncHandler(async (req, res) => {
  const proposal = await proposalService.submitProposal(req.user._id, req.params.projectId, req.body);
  ApiResponse.created(res, "Proposal submitted successfully", { proposal });
});

// Client gets proposals for a project
const getProjectProposals = asyncHandler(async (req, res) => {
  const proposals = await proposalService.getProjectProposals(req.user._id, req.params.projectId);
  ApiResponse.success(res, "Proposals fetched", { proposals });
});

// Freelancer gets my proposals
const getMyProposals = asyncHandler(async (req, res) => {
  const proposals = await proposalService.getMyProposals(req.user._id);
  ApiResponse.success(res, "My proposals fetched", { proposals });
});

// Client responds (approve/reject) to proposal
const respondToProposal = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const proposal = await proposalService.respondToProposal(req.user._id, req.params.proposalId, action);
  ApiResponse.success(res, `Proposal ${action}d successfully`, { proposal });
});

module.exports = {
  postClientProject,
  getOpenProjects,
  submitProposal,
  getProjectProposals,
  getMyProposals,
  respondToProposal,
};
