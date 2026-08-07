const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  depositEscrow,
  releaseEscrow,
  refundEscrow,
  getProjectEscrow,
} = require("../controllers/escrow.controller");

router.use(protect);

router.post("/deposit", depositEscrow);
router.post("/:escrowId/release", releaseEscrow);
router.post("/:escrowId/refund", refundEscrow);
router.get("/project/:projectId", getProjectEscrow);

module.exports = router;
