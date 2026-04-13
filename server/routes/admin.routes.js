const router = require("express").Router();
const {
  getStats, getUsers, updateUser, deleteUser, getRevenueChart,
  getRevenueSummary, getPlatformConfig, updatePlatformConfig, getActivityLog,
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect, authorize("admin"));

router.get("/stats",          getStats);
router.get("/users",          getUsers);
router.patch("/users/:id",    updateUser);
router.delete("/users/:id",   deleteUser);
router.get("/revenue",        getRevenueChart);
router.get("/revenue/summary", getRevenueSummary);
router.get("/config",         getPlatformConfig);
router.patch("/config",       updatePlatformConfig);
router.get("/activity",       getActivityLog);

module.exports = router;
