const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError    = require("../utils/ApiError");
const Escrow      = require("../models/Escrow");
const Project     = require("../models/Project");
const User        = require("../models/User");
const Config      = require("../models/Config");

/**
 * Deposit funds into Escrow for a project
 */
exports.depositEscrow = asyncHandler(async (req, res) => {
  const { projectId, amount, notes } = req.body;
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const freelancerId = project.assignedFreelancer || project.owner;
  if (!freelancerId) {
    throw new ApiError(400, "Project must have an assigned freelancer to deposit escrow");
  }

  // Get config commission rate
  const config = await Config.findOne({ key: "global" }) || {};
  const commissionPercentage = config.defaultCommissionPercentage ?? 10;
  const commissionAmount = Math.round((amount * (commissionPercentage / 100)) * 100) / 100;
  const netAmount = Math.round((amount - commissionAmount) * 100) / 100;

  let escrow = await Escrow.findOne({ project: projectId, status: { $in: ["pending", "funded"] } });

  if (escrow) {
    escrow.amount = amount;
    escrow.commissionPercentage = commissionPercentage;
    escrow.commissionAmount = commissionAmount;
    escrow.netAmount = netAmount;
    escrow.status = "funded";
    escrow.fundedAt = new Date();
    escrow.notes = notes || escrow.notes;
    await escrow.save();
  } else {
    escrow = await Escrow.create({
      project: projectId,
      client: req.user._id,
      freelancer: freelancerId,
      amount,
      commissionPercentage,
      commissionAmount,
      netAmount,
      status: "funded",
      fundedAt: new Date(),
      notes: notes || "Initial project escrow deposit",
    });
  }

  // Update project status to active if planning/open
  if (project.status === "planning" || project.status === "open") {
    project.status = "active";
    await project.save();
  }

  ApiResponse.success(res, "Escrow funded successfully", { escrow });
});

/**
 * Release funds from Escrow to Freelancer
 */
exports.releaseEscrow = asyncHandler(async (req, res) => {
  const { escrowId } = req.params;
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new ApiError(404, "Escrow record not found");

  if (escrow.status !== "funded" && escrow.status !== "disputed") {
    throw new ApiError(400, `Escrow cannot be released from state: ${escrow.status}`);
  }

  // Authorization check (Client, assigned freelancer approval, or Admin)
  if (
    req.user.role !== "admin" &&
    escrow.client.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Only the client or an admin can release escrow funds");
  }

  escrow.status = "released";
  escrow.releasedAt = new Date();
  await escrow.save();

  // Credit total earnings to freelancer profile
  await User.findByIdAndUpdate(escrow.freelancer, {
    $inc: { totalEarnings: escrow.netAmount },
  });

  // Mark project as completed
  await Project.findByIdAndUpdate(escrow.project, { status: "completed" });

  ApiResponse.success(res, "Escrow released successfully to freelancer", { escrow });
});

/**
 * Refund funds from Escrow to Client
 */
exports.refundEscrow = asyncHandler(async (req, res) => {
  const { escrowId } = req.params;
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new ApiError(404, "Escrow record not found");

  if (req.user.role !== "admin" && escrow.freelancer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only an admin or freelancer consent can initiate a full refund");
  }

  escrow.status = "refunded";
  escrow.refundedAt = new Date();
  await escrow.save();

  ApiResponse.success(res, "Escrow refunded to client", { escrow });
});

/**
 * Get Escrow status for a project
 */
exports.getProjectEscrow = asyncHandler(async (req, res) => {
  const escrow = await Escrow.findOne({ project: req.params.projectId })
    .populate("client", "name email avatar")
    .populate("freelancer", "name email avatar");

  ApiResponse.success(res, "Project escrow status fetched", { escrow });
});
