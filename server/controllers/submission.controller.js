const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError    = require("../utils/ApiError");
const Submission  = require("../models/Submission");
const Project     = require("../models/Project");

/**
 * Freelancer submits project deliverables
 */
exports.createSubmission = asyncHandler(async (req, res) => {
  const { projectId, title, description, attachments } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  // Get current version count for this project
  const previousSubmissionsCount = await Submission.countDocuments({ project: projectId });

  const submission = await Submission.create({
    project: projectId,
    freelancer: req.user._id,
    title,
    description,
    attachments: attachments || [],
    version: previousSubmissionsCount + 1,
    status: "submitted",
  });

  // Update project status to review if active
  if (project.status === "active") {
    project.status = "on_hold"; // Pending client review
    await project.save();
  }

  ApiResponse.created(res, "Work deliverable submitted successfully", { submission });
});

/**
 * Client requests revision on a submission
 */
exports.requestRevision = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { clientFeedback } = req.body;

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");

  submission.status = "revision_requested";
  submission.clientFeedback = clientFeedback || "Revisions requested";
  submission.reviewedAt = new Date();
  await submission.save();

  // Re-activate project for freelancer to work
  await Project.findByIdAndUpdate(submission.project, { status: "active" });

  ApiResponse.success(res, "Revision requested", { submission });
});

/**
 * Client approves a submission
 */
exports.approveSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { clientFeedback } = req.body;

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");

  submission.status = "approved";
  submission.clientFeedback = clientFeedback || "Deliverable approved!";
  submission.reviewedAt = new Date();
  await submission.save();

  ApiResponse.success(res, "Deliverable approved successfully", { submission });
});

/**
 * Get submissions for a project
 */
exports.getProjectSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ project: req.params.projectId })
    .populate("freelancer", "name email avatar")
    .sort({ version: -1 });

  ApiResponse.success(res, "Project submissions fetched", { submissions });
});
