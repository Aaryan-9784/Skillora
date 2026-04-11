const router = require("express").Router();
const {
  createSkill, getSkills, getSkillsByCategory, updateSkill, deleteSkill,
} = require("../controllers/skill.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/by-category", getSkillsByCategory);
router.route("/").get(getSkills).post(createSkill);
router.route("/:id").patch(updateSkill).delete(deleteSkill);

module.exports = router;
