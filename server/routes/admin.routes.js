const router = require("express").Router();
const { getStats, getUsers, updateUser, deleteUser, getRevenueChart } =
  require("../controllers/admin.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect, authorize("admin"));

router.get("/stats",          getStats);
router.get("/users",          getUsers);
router.patch("/users/:id",    updateUser);
router.delete("/users/:id",   deleteUser);
router.get("/revenue",        getRevenueChart);

module.exports = router;
