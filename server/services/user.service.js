const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return user;
};

const updateProfile = async (userId, updates) => {
  const allowed = ["name", "avatar", "phone", "title", "bio", "company", "address", "preferences"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound("User not found");

  if (filtered.avatar !== undefined || filtered.name !== undefined || filtered.phone !== undefined || filtered.company !== undefined) {
    const Client = require("../models/Client");
    const clientUpdates = {};
    if (filtered.avatar !== undefined) clientUpdates.avatar = filtered.avatar;
    if (filtered.name !== undefined) clientUpdates.name = filtered.name;
    if (filtered.phone !== undefined) clientUpdates.phone = filtered.phone;
    if (filtered.company !== undefined) clientUpdates.company = filtered.company;

    await Client.updateMany(
      { $or: [{ owner: user._id }, { email: user.email }, ...(user.clientRef ? [{ _id: user.clientRef }] : [])] },
      clientUpdates
    );
  }

  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  if (currentPassword && user.password) {
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();
  return true;
};

module.exports = { getProfile, updateProfile, changePassword };
