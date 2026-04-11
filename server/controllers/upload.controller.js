const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const User         = require("../models/User");

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");

  const url = req.file.path || req.file.secure_url || "";
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: url }, { new: true });
  ApiResponse.success(res, "Avatar updated", { avatar: url, user });
});

const uploadProjectFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const url = req.file.path || req.file.secure_url || "";
  ApiResponse.success(res, "File uploaded", { url, filename: req.file.originalname });
});

module.exports = { uploadAvatar, uploadProjectFile };
