const Proposal   = require("../models/Proposal");
const Project    = require("../models/Project");
const User       = require("../models/User");
const ApiError   = require("../utils/ApiError");
const notify     = require("../utils/notify");
const QueryBuilder = require("../utils/queryBuilder");
const { sendProposalNotification } = require("./email.service");

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
  const filter = { status: { $in: ["open", "planning"] }, isDeleted: { $ne: true } };

  if (reqQuery.category && reqQuery.category !== "All") {
    filter.category = reqQuery.category;
  }
  if (reqQuery.skill) {
    filter.requiredSkills = { $in: [new RegExp(reqQuery.skill, "i")] };
  }
  if (reqQuery.minBudget || reqQuery.maxBudget) {
    filter.budget = {};
    if (reqQuery.minBudget) filter.budget.$gte = Number(reqQuery.minBudget);
    if (reqQuery.maxBudget) filter.budget.$lte = Number(reqQuery.maxBudget);
  }

  const cleanReqQuery = { ...reqQuery };
  delete cleanReqQuery.category;
  delete cleanReqQuery.skill;
  delete cleanReqQuery.minBudget;
  delete cleanReqQuery.maxBudget;

  const baseQuery = Project.find(filter);
  return new QueryBuilder(baseQuery, cleanReqQuery)
    .filter()
    .search(["title", "description", "category", "requiredSkills"])
    .sort("-createdAt")
    .paginate(parseInt(reqQuery.limit, 10) || 50)
    .lean()
    .populate("clientUser", "name email company avatar")
    .populate("owner", "name email company avatar")
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

  let clientUserId = project.clientUser || project.owner;
  if (!project.clientUser && project.clientId) {
    const clientUser = await User.findOne({ clientRef: project.clientId, role: "client" });
    if (clientUser) {
      clientUserId = clientUser._id;
      project.clientUser = clientUser._id;
      await project.save();
    }
  }

  const proposal = await Proposal.create({
    project: projectId,
    freelancer: freelancerId,
    client: clientUserId,
    coverLetter: data.coverLetter,
    bidAmount: Number(data.bidAmount) || project.budget || 0,
    currency: data.currency || project.currency || "USD",
    estimatedDays: Number(data.estimatedDays || data.deliveryDays) || 7,
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

  const clientUserObj = await User.findById(clientUserId).select("name email");
  if (clientUserObj?.email) {
    sendProposalNotification(clientUserObj.email, clientUserObj.name, proposal, project, "new_proposal").catch(() => {});
  }

  try {
    const { emitToUser } = require("../config/socket");
    emitToUser(clientUserId, "project:proposal_received", {
      projectId,
      proposalId: proposal._id,
      freelancerId,
      projectTitle: project.title,
    });
    emitToUser(clientUserId, "dashboard:refresh", {});
  } catch (sockErr) {}

  return proposal;
};

/**
 * Checks if a user has client/owner authorization for a project.
 */
const isAuthorizedClientForProject = async (userOrId, project) => {
  if (!userOrId || !project) return false;

  let user = userOrId;
  if (!user._id) {
    user = await User.findById(userOrId).lean();
    if (!user) return false;
  }

  const userId = user._id.toString();

  // 1. Admin has access
  if (user.role === "admin") return true;

  // 2. Project owner (client or freelancer creator)
  if (project.owner && project.owner.toString() === userId) return true;

  // 3. Assigned client user
  if (project.clientUser && project.clientUser.toString() === userId) return true;

  // 4. Client user whose clientRef matches project's clientId
  if (user.clientRef && project.clientId && project.clientId.toString() === user.clientRef.toString()) {
    if (!project.clientUser) {
      await Project.findByIdAndUpdate(project._id, { clientUser: user._id });
    }
    return true;
  }

  // 5. Look up Client document by project.clientId
  if (project.clientId) {
    const Client = require("../models/Client");
    const clientDoc = await Client.findById(project.clientId).lean();
    if (clientDoc) {
      if (user.email && clientDoc.email && clientDoc.email.toLowerCase() === user.email.toLowerCase()) {
        if (!project.clientUser) {
          await Project.findByIdAndUpdate(project._id, { clientUser: user._id });
        }
        return true;
      }
      if (clientDoc.owner && clientDoc.owner.toString() === userId) {
        return true;
      }
    }
  }

  // 6. Check if any Client doc matching user's email is linked to this project
  if (user.email && project.clientId) {
    const Client = require("../models/Client");
    const clientMatch = await Client.findOne({
      _id: project.clientId,
      email: user.email.toLowerCase(),
    }).lean();
    if (clientMatch) {
      if (!project.clientUser) {
        await Project.findByIdAndUpdate(project._id, { clientUser: user._id });
      }
      return true;
    }
  }

  // 7. Check if user is the client targeted by any proposal on this project
  const hasClientProposal = await Proposal.exists({ project: project._id, client: user._id });
  if (hasClientProposal) {
    if (!project.clientUser) {
      await Project.findByIdAndUpdate(project._id, { clientUser: user._id });
    }
    return true;
  }

  // 8. Open client project fallback: If posted by client role and no clientUser assigned yet
  if (project.createdByRole === "client" && !project.clientUser && user.role === "client") {
    await Project.findByIdAndUpdate(project._id, { clientUser: user._id });
    return true;
  }

  return false;
};

/**
 * Client fetches proposals submitted for a specific project.
 */
const getProjectProposals = async (userOrId, projectId) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: { $ne: true } });
  if (!project) throw ApiError.notFound("Project not found");

  const isAuthorized = await isAuthorizedClientForProject(userOrId, project);
  if (!isAuthorized) {
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
const respondToProposal = async (userOrId, proposalId, action) => {
  const proposal = await Proposal.findById(proposalId).populate("project");
  if (!proposal) throw ApiError.notFound("Proposal not found");

  const project = proposal.project;
  if (!project) throw ApiError.notFound("Project not found");

  let user = userOrId;
  if (!user._id) {
    user = await User.findById(userOrId);
    if (!user) throw ApiError.unauthorized("User not found");
  }
  const userId = user._id.toString();

  const isAuthorized = await isAuthorizedClientForProject(user, project);
  const isDirectClient = proposal.client && proposal.client.toString() === userId;

  if (!isAuthorized && !isDirectClient) {
    throw ApiError.forbidden("Only the project owner client can respond to this proposal");
  }

  // Ensure proposal.client reflects this client user
  if (!proposal.client || proposal.client.toString() !== userId) {
    proposal.client = user._id;
  }

  const clientUserId = user._id;

  if (action === "approve") {
    proposal.status = "approved";
    await proposal.save();

    // Reject other proposals for this project
    await Proposal.updateMany(
      { project: proposal.project._id, _id: { $ne: proposal._id } },
      { status: "rejected" }
    );

    // Update project: assign freelancer, set clientUser, set status active
    await Project.findByIdAndUpdate(proposal.project._id, {
      assignedFreelancer: proposal.freelancer,
      clientUser: clientUserId,
      status: "active",
      budget: proposal.bidAmount,
    });

    // Establish Chat Conversation connection between Client & Freelancer
    const Conversation = require("../models/Conversation");
    const Message      = require("../models/Message");
    const welcomeMsgText = `Project "${proposal.project.title}" started. Connection established!`;

    let conversation = await Conversation.findOne({ projectId: proposal.project._id });
    if (!conversation) {
      conversation = await Conversation.create({
        type: "project",
        projectId: proposal.project._id,
        participants: [clientUserId, proposal.freelancer],
        lastMessage: {
          text: welcomeMsgText,
          sender: clientUserId,
          createdAt: new Date(),
        },
      });
    } else {
      const partSet = new Set(conversation.participants.map((p) => p.toString()));
      partSet.add(clientUserId.toString());
      partSet.add(proposal.freelancer.toString());
      conversation.participants = Array.from(partSet);
      await conversation.save();
    }

    const existingMsg = await Message.findOne({ conversationId: conversation._id });
    if (!existingMsg) {
      await Message.create({
        conversationId: conversation._id,
        sender: clientUserId,
        type: "system_event",
        content: welcomeMsgText,
      });
    }

    try {
      const { emitToUser } = require("../config/socket");
      const payload = {
        conversationId: conversation._id,
        projectId: proposal.project._id,
        projectTitle: proposal.project.title,
        clientUser: clientUserId,
        freelancer: proposal.freelancer,
      };
      emitToUser(clientUserId, "chat:conversation_updated", payload);
      emitToUser(proposal.freelancer, "chat:conversation_updated", payload);
      emitToUser(proposal.freelancer, "project:proposal_approved", payload);
      emitToUser(proposal.freelancer, "project:proposal_status", { proposalId: proposal._id, status: "approved" });
      emitToUser(clientUserId, "dashboard:refresh", {});
      emitToUser(proposal.freelancer, "dashboard:refresh", {});
    } catch (sockErr) {}

    await notify({
      recipient: proposal.freelancer,
      type: "proposal_approved",
      title: "Proposal Approved! 🎉",
      message: `Your proposal for "${proposal.project.title}" has been accepted! You can now start working and chatting with the client.`,
      link: `/messages`,
      refModel: "Project",
      refId: proposal.project._id,
    });

    const freelancerObj = await User.findById(proposal.freelancer).select("name email");
    if (freelancerObj?.email) {
      sendProposalNotification(freelancerObj.email, freelancerObj.name, proposal, proposal.project, "proposal_approved").catch(() => {});
    }
  } else if (action === "shortlist") {
    proposal.status = "shortlisted";
    await proposal.save();

    try {
      const { emitToUser } = require("../config/socket");
      emitToUser(proposal.freelancer, "project:proposal_status", { proposalId: proposal._id, status: "shortlisted" });
      emitToUser(proposal.freelancer, "dashboard:refresh", {});
    } catch (sockErr) {}

    await notify({
      recipient: proposal.freelancer,
      type: "proposal_shortlisted",
      title: "Proposal Shortlisted! ⭐",
      message: `Your proposal for "${proposal.project.title}" has been shortlisted by the client.`,
      link: `/projects`,
      refModel: "Project",
      refId: proposal.project._id,
    });
  } else if (action === "reject") {
    proposal.status = "rejected";
    await proposal.save();

    try {
      const { emitToUser } = require("../config/socket");
      emitToUser(proposal.freelancer, "project:proposal_status", { proposalId: proposal._id, status: "rejected" });
      emitToUser(proposal.freelancer, "dashboard:refresh", {});
    } catch (sockErr) {}

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
