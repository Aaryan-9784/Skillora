const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError    = require("../utils/ApiError");
const Review      = require("../models/Review");
const Project     = require("../models/Project");
const User        = require("../models/User");
const notify      = require("../utils/notify");

/**
 * Create a new project review
 */
exports.createReview = asyncHandler(async (req, res) => {
  const { projectId, revieweeId, rating, communicationRating, qualityRating, deadlineRating, comment } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const existing = await Review.findOne({ project: projectId, reviewer: req.user._id });
  if (existing) {
    throw new ApiError(400, "You have already submitted a review for this project");
  }

  const reviewerRole = req.user.role === "client" ? "client" : "freelancer";

  const review = await Review.create({
    project: projectId,
    reviewer: req.user._id,
    reviewee: revieweeId,
    reviewerRole,
    rating,
    communicationRating: communicationRating || 5,
    qualityRating: qualityRating || 5,
    deadlineRating: deadlineRating || 5,
    comment,
  });

  // Recalculate average rating & total reviews for reviewee
  const userReviews = await Review.find({ reviewee: revieweeId });
  const totalReviews = userReviews.length;
  const avgRating = totalReviews > 0
    ? Math.round((userReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews) * 10) / 10
    : 0;

  await User.findByIdAndUpdate(revieweeId, {
    averageRating: avgRating,
    totalReviews: totalReviews,
  });

  try {
    await notify({
      recipient: revieweeId,
      type: "review_received",
      title: "New Review Received",
      message: `${req.user.name || "A user"} gave you a ${rating}-star review on "${project.title}".`,
      link: `/profile/${revieweeId}`,
      refModel: "Review",
      refId: review._id,
    });
  } catch (e) {}

  ApiResponse.created(res, "Review submitted successfully", { review });
});

/**
 * Get reviews for a specific user profile
 */
exports.getReviewsForUser = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate("reviewer", "name avatar title company")
    .populate("project", "title category")
    .sort({ createdAt: -1 });

  ApiResponse.success(res, "User reviews fetched", { reviews });
});

/**
 * Get reviews for a specific project
 */
exports.getProjectReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ project: req.params.projectId })
    .populate("reviewer", "name avatar role")
    .populate("reviewee", "name avatar role");

  ApiResponse.success(res, "Project reviews fetched", { reviews });
});
