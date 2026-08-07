const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError    = require("../utils/ApiError");
const Dispute     = require("../models/Dispute");
const Project     = require("../models/Project");
const Escrow      = require("../models/Escrow");
const User        = require("../models/User");

/**
 * Raise a dispute for a project
 */
exports.createDispute = asyncHandler(async (req, res) => {
  const { projectId, reason, description, evidence } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const clientUser = project.clientUser || project.owner;
  const freelancerUser = project.assignedFreelancer || project.owner;

  const dispute = await Dispute.create({
    project: projectId,
    raisedBy: req.user._id,
    client: clientUser,
    freelancer: freelancerUser,
    reason,
    description,
    evidence: evidence || [],
    status: "open",
  });

  // Freeze escrow status to disputed
  await Escrow.findOneAndUpdate(
    { project: projectId },
    { status: "disputed" }
  );

  ApiResponse.created(res, "Dispute raised successfully. Admin review initiated.", { dispute });
});

/**
 * Get all disputes (Admin only)
 */
exports.getAllDisputes = asyncHandler(async (req, res) => {
  const rawDisputes = await Dispute.find()
    .populate("project", "title category budget status description")
    .populate("raisedBy", "name email role avatar")
    .populate("client", "name email avatar")
    .populate("freelancer", "name email avatar")
    .sort({ createdAt: -1 })
    .lean();

  // Attach Escrow data if available for each dispute
  const disputes = await Promise.all(
    rawDisputes.map(async (disp) => {
      let escrow = null;
      if (disp.project?._id) {
        escrow = await Escrow.findOne({ project: disp.project._id }).lean();
      }
      return {
        ...disp,
        escrow: escrow || {
          amount: disp.project?.budget || 0,
          currency: "USD",
          status: disp.status === "open" ? "disputed" : disp.status.includes("refund") ? "refunded" : disp.status.includes("release") ? "released" : "pending",
          netAmount: disp.project?.budget ? Math.round(disp.project.budget * 0.9) : 0,
        },
      };
    })
  );

  ApiResponse.success(res, "Disputes fetched", { disputes });
});

/**
 * Resolve dispute or update status (Admin only)
 */
exports.resolveDispute = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { decision, resolutionNotes } = req.body; // decision: "refund" | "release" | "under_review"

  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new ApiError(404, "Dispute not found");

  const escrow = await Escrow.findOne({ project: dispute.project });

  if (decision === "refund") {
    dispute.status = "resolved_refund";
    if (escrow) {
      escrow.status = "refunded";
      escrow.refundedAt = new Date();
      await escrow.save();
    }
  } else if (decision === "release") {
    dispute.status = "resolved_release";
    if (escrow) {
      escrow.status = "released";
      escrow.releasedAt = new Date();
      await escrow.save();

      // Credit freelancer
      if (escrow.freelancer) {
        await User.findByIdAndUpdate(escrow.freelancer, {
          $inc: { totalEarnings: escrow.netAmount || 0 },
        });
      }
    }
  } else if (decision === "under_review") {
    dispute.status = "under_review";
  }

  if (resolutionNotes) {
    dispute.resolutionNotes = resolutionNotes;
  } else if (decision !== "under_review") {
    dispute.resolutionNotes = `Resolved by Admin: ${decision}`;
  }

  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  ApiResponse.success(res, `Dispute status updated: ${dispute.status}`, { dispute });
});

/**
 * Seed sample disputes for Admin testing (Admin only)
 */
exports.seedSampleDisputes = asyncHandler(async (req, res) => {
  // Find or create sample projects/users to bind sample disputes to
  let sampleProject = await Project.findOne();
  let clientUser = req.user;
  let freelancerUser = req.user;

  if (!sampleProject) {
    sampleProject = await Project.create({
      title: "Full-Stack SaaS Platform Modernization",
      category: "Web Development",
      budget: 4500,
      status: "in_progress",
      owner: req.user._id,
      clientUser: req.user._id,
    });
  }

  const sampleDisputes = [
    {
      project: sampleProject._id,
      raisedBy: clientUser._id,
      client: clientUser._id,
      freelancer: freelancerUser._id,
      reason: "Incomplete Deliverables & Scope Creep",
      description: "The freelancer submitted the final milestone without implementing the real-time WebSocket messaging and automated payment reconciliation specified in Section 3 of the contract.",
      evidence: [
        { name: "Contract_Specification_V2.pdf", url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=60" },
        { name: "Milestone_Submission_Audit.png", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60" },
      ],
      status: "open",
    },
    {
      project: sampleProject._id,
      raisedBy: freelancerUser._id,
      client: clientUser._id,
      freelancer: freelancerUser._id,
      reason: "Client Unresponsive to Approval Request",
      description: "Final deliverables for Figma UI design system were uploaded 14 days ago. Client has been utilizing assets in production environment without approving escrow payout.",
      evidence: [
        { name: "Production_Asset_Usage_Proof.png", url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60" },
      ],
      status: "under_review",
      resolutionNotes: "Admin initiated evidence verification with domain registrar and hosting log audits.",
    },
  ];

  await Dispute.insertMany(sampleDisputes);
  ApiResponse.success(res, "Sample disputes seeded successfully", {});
});

