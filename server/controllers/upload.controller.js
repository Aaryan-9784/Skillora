const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const User         = require("../models/User");
const Client       = require("../models/Client");

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");

  const url = req.file.path || req.file.secure_url || "";
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: url }, { new: true });

  await Client.updateMany(
    { $or: [{ owner: req.user._id }, { email: req.user.email }, ...(req.user.clientRef ? [{ _id: req.user.clientRef }] : [])] },
    { avatar: url }
  );

  ApiResponse.success(res, "Avatar updated", { avatar: url, user });
});

const uploadProjectFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const url = req.file.path || req.file.secure_url || "";
  ApiResponse.success(res, "File uploaded", { url, filename: req.file.originalname });
});

module.exports = { uploadAvatar, uploadProjectFile };
