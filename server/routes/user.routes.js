const router = require("express").Router();
const { getProfile, updateProfile, changePassword } = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/change-password", changePassword);

module.exports = router;
