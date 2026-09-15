const router = require("express").Router();
const { getProfile, updateProfile, changePassword, getFreelancers, getUserById } = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/freelancers", getFreelancers);

// Protected profile routes (MUST be before /:id)
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);

// Public parameterized user lookup
router.get("/:id", getUserById);

module.exports = router;

