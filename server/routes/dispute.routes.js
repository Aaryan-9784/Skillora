const router = require("express").Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  createDispute,
  getAllDisputes,
  resolveDispute,
  seedSampleDisputes,
} = require("../controllers/dispute.controller");

router.use(protect);

router.post("/", createDispute);
router.get("/", authorize("admin"), getAllDisputes);
router.post("/seed", authorize("admin"), seedSampleDisputes);
router.patch("/:disputeId/resolve", authorize("admin"), resolveDispute);

module.exports = router;

