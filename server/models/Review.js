const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ["client", "freelancer"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communicationRating: { type: Number, min: 1, max: 5, default: 5 },
    qualityRating:       { type: Number, min: 1, max: 5, default: 5 },
    deadlineRating:      { type: Number, min: 1, max: 5, default: 5 },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

// Post-save hook to recalculate reviewee's average rating & review count
reviewSchema.post("save", async function () {
  const User = mongoose.model("User");
  const Review = mongoose.model("Review");

  const stats = await Review.aggregate([
    { $match: { reviewee: this.reviewee } },
    {
      $group: {
        _id: "$reviewee",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(this.reviewee, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }
});

module.exports = model("Review", reviewSchema);
