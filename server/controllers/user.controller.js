const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const userService  = require("../services/user.service");
const User         = require("../models/User");

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  ApiResponse.success(res, "Profile fetched", { user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  ApiResponse.success(res, "Profile updated", { user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user._id, currentPassword, newPassword);
  ApiResponse.success(res, "Password changed successfully");
});

const getFreelancers = asyncHandler(async (req, res) => {
  const { search, skill } = req.query;
  const filter = { role: "freelancer", isPublicProfile: true };

  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { title: new RegExp(search, "i") },
      { bio: new RegExp(search, "i") },
    ];
  }

  if (skill) {
    filter.skills = skill;
  }

  const freelancers = await User.find(filter)
    .populate("skills", "name category")
    .select("name email avatar title bio company hourlyRate averageRating totalReviews totalEarnings skills portfolioItems createdAt")
    .sort({ averageRating: -1, totalReviews: -1 });

  ApiResponse.success(res, "Freelancers directory fetched", { freelancers });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("skills", "name category")
    .select("-password -refreshToken");

  if (!user) {
    throw ApiError.notFound("User profile not found");
  }
  ApiResponse.success(res, "User profile fetched", { user });
});

module.exports = { getProfile, updateProfile, changePassword, getFreelancers, getUserById };
