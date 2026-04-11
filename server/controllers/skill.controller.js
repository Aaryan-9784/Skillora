const asyncHandler  = require("../utils/asyncHandler");
const ApiResponse   = require("../utils/ApiResponse");
const skillService  = require("../services/skill.service");

const createSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.createSkill(req.user._id, req.body);
  ApiResponse.created(res, "Skill added", { skill });
});

const getSkills = asyncHandler(async (req, res) => {
  const skills = await skillService.getSkills(req.user._id, req.query);
  ApiResponse.success(res, "Skills fetched", { skills });
});

const getSkillsByCategory = asyncHandler(async (req, res) => {
  const categories = await skillService.getSkillsByCategory(req.user._id);
  ApiResponse.success(res, "Skills by category", { categories });
});

const updateSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.updateSkill(req.params.id, req.user._id, req.body);
  ApiResponse.success(res, "Skill updated", { skill });
});

const deleteSkill = asyncHandler(async (req, res) => {
  await skillService.deleteSkill(req.params.id, req.user._id);
  ApiResponse.success(res, "Skill deleted");
});

module.exports = { createSkill, getSkills, getSkillsByCategory, updateSkill, deleteSkill };
