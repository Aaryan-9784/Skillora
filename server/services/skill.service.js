const Skill    = require("../models/Skill");
const User     = require("../models/User");
const ApiError = require("../utils/ApiError");

const createSkill = async (ownerId, data) => {
  const skill = await Skill.create({ ...data, owner: ownerId });
  // Add to user's skills array
  await User.findByIdAndUpdate(ownerId, { $addToSet: { skills: skill._id } });
  return skill;
};

const getSkills = async (ownerId, { category } = {}) => {
  const filter = { owner: ownerId };
  if (category) filter.category = category;
  return Skill.find(filter).sort("category name").lean();
};

const updateSkill = async (skillId, ownerId, updates) => {
  const skill = await Skill.findOneAndUpdate(
    { _id: skillId, owner: ownerId },
    updates,
    { new: true, runValidators: true }
  );
  if (!skill) throw ApiError.notFound("Skill not found");
  return skill;
};

const deleteSkill = async (skillId, ownerId) => {
  const skill = await Skill.findOneAndDelete({ _id: skillId, owner: ownerId });
  if (!skill) throw ApiError.notFound("Skill not found");
  await User.findByIdAndUpdate(ownerId, { $pull: { skills: skillId } });
  return true;
};

/**
 * Skills grouped by category — for profile/portfolio display.
 */
const getSkillsByCategory = async (ownerId) => {
  return Skill.aggregate([
    { $match: { owner: ownerId } },
    { $sort: { level: -1 } },
    {
      $group: {
        _id:    "$category",
        skills: { $push: { name: "$name", level: "$level", levelLabel: "$levelLabel" } },
        avgLevel: { $avg: "$level" },
      },
    },
    { $sort: { avgLevel: -1 } },
  ]);
};

module.exports = { createSkill, getSkills, updateSkill, deleteSkill, getSkillsByCategory };
