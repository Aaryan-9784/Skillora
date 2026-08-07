const Proposal   = require("../models/Proposal");
const Project    = require("../models/Project");
const User       = require("../models/User");
const ApiError   = require("../utils/ApiError");
const notify     = require("../utils/notify");
const QueryBuilder = require("../utils/queryBuilder");

/**
 * Client posts a new open project.
 */
const postClientProject = async (clientUser, data) => {
  const project = await Project.create({
    ...data,
    owner: clientUser._id,
    clientUser: clientUser._id,
    clientId: clientUser.clientRef || null,
    createdByRole: "client",
    status: "open",
    proposalsCount: 0,
  });

  await notify({
    recipient: clientUser._id,
    type: "project_created",
    title: "Project Posted Successfully",
    message: `Your project "${project.title}" is now open for freelancer proposals.`,
    link: `/client/projects`,
    refModel: "Project",
    refId: project._id,
  });

  return project;
};

/**
 * Freelancer gets all open client projects from the marketplace.
 */
const getOpenProjects = async (reqQuery = {}) => {
  const filter = { status: "open", isDeleted: { $ne: true } };

  if (reqQuery.category && reqQuery.category !== "All") {
    filter.category = reqQuery.category;
  }
  if (reqQuery.skill) {
    filter.requiredSkills = { $in: [reqQuery.skill] };
  }
  if (reqQuery.minBudget || reqQuery.maxBudget) {
    filter.budget = {};
    if (reqQuery.minBudget) filter.budget.$gte = Number(reqQuery.minBudget);
    if (reqQuery.maxBudget) filter.budget.$lte = Number(reqQuery.maxBudget);
  }

  const baseQuery = Project.find(filter);
  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .search(["title", "description", "category"])
    .sort("-createdAt")
    .paginate(15)
    .lean()
    .populate("clientUser", "name email company avatar")
    .populate("clientId", "name company avatar")
    .exec();
};

/**
 * Freelancer submits a proposal for an open project.
 */
const submitProposal = async (freelancerId, projectId, data) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: { $ne: true } });
  if (!project) throw ApiError.notFound("Project not found");
  if (project.status !== "open") {
    throw ApiError.badRequest("This project is no longer accepting proposals");
  }

  const existing = await Proposal.findOne({ project: projectId, freelancer: freelancerId });
  if (existing) {
    throw ApiError.badRequest("You have already submitted a proposal for this project");
  }

  const clientUserId = project.clientUser || project.owner;

  const proposal = await Proposal.create({
    project: projectId,
    freelancer: freelancerId,
    client: clientUserId,
    coverLetter: data.coverLetter,
    bidAmount: data.bidAmount,
    currency: data.currency || project.currency || "USD",
    estimatedDays: data.estimatedDays,
    attachments: data.attachments || [],
    status: "pending",
  });

  await Project.findByIdAndUpdate(projectId, { $inc: { proposalsCount: 1 } });

  const freelancer = await User.findById(freelancerId).select("name avatar");

  await notify({
    recipient: clientUserId,
    type: "proposal_received",
    title: "New Proposal Received",
    message: `${freelancer?.name || "A freelancer"} submitted a proposal for "${project.title}".`,
    link: `/client/projects`,
    refModel: "Project",
    refId: projectId,
  });

  return proposal;
};

/**
 * Client fetches proposals submitted for a specific project.
 */
const getProjectProposals = async (clientUserId, projectId) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: { $ne: true } });
  if (!project) throw ApiError.notFound("Project not found");

  if (project.clientUser?.toString() !== clientUserId.toString() && project.owner.toString() !== clientUserId.toString()) {
    throw ApiError.forbidden("Access denied to project proposals");
  }

  const proposals = await Proposal.find({ project: projectId })
    .sort("-createdAt")
    .populate("freelancer", "name email avatar title bio skills hourlyRate")
    .lean();

  return proposals;
};

/**
 * Freelancer fetches proposals submitted by themselves.
 */
const getMyProposals = async (freelancerId) => {
  const proposals = await Proposal.find({ freelancer: freelancerId })
    .sort("-createdAt")
    .populate({
      path: "project",
      select: "title budget currency category status deadline clientUser",
      populate: { path: "clientUser", select: "name company avatar" },
    })
    .lean();

  return proposals;
};

/**
 * Client approves or rejects a proposal.
 */
const respondToProposal = async (clientUserId, proposalId, action) => {
  const proposal = await Proposal.findById(proposalId).populate("project");
  if (!proposal) throw ApiError.notFound("Proposal not found");

  if (proposal.client.toString() !== clientUserId.toString()) {
    throw ApiError.forbidden("Only the project owner client can respond to this proposal");
  }

  if (action === "approve") {
    proposal.status = "approved";
    await proposal.save();

    // Reject other proposals for this project
    await Proposal.updateMany(
      { project: proposal.project._id, _id: { $ne: proposal._id } },
      { status: "rejected" }
    );

    // Update project: assign freelancer, set status active, set owner to freelancer for active workspace view
    await Project.findByIdAndUpdate(proposal.project._id, {
      assignedFreelancer: proposal.freelancer,
      owner: proposal.freelancer,
      status: "active",
      budget: proposal.bidAmount,
    });

    await notify({
      recipient: proposal.freelancer,
      type: "proposal_approved",
      title: "Proposal Approved! 🎉",
      message: `Your proposal for "${proposal.project.title}" has been accepted! You can now start working on it.`,
      link: `/projects/${proposal.project._id}`,
      refModel: "Project",
      refId: proposal.project._id,
    });
  } else if (action === "reject") {
    proposal.status = "rejected";
    await proposal.save();

    await notify({
      recipient: proposal.freelancer,
      type: "proposal_rejected",
      title: "Proposal Status Update",
      message: `Your proposal for "${proposal.project.title}" was not accepted.`,
      link: `/projects`,
      refModel: "Project",
      refId: proposal.project._id,
    });
  } else {
    throw ApiError.badRequest("Invalid action specified");
  }

  return proposal;
};

module.exports = {
  postClientProject,
  getOpenProjects,
  submitProposal,
  getProjectProposals,
  getMyProposals,
  respondToProposal,
};
