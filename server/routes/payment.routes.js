const router = require("express").Router();
const {
  createPayment, getPayments, getPayment, updatePayment, getEarningsSummary,
} = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/earnings", getEarningsSummary);
router.route("/").get(getPayments).post(createPayment);
router.route("/:id").get(getPayment).patch(updatePayment);

module.exports = router;
