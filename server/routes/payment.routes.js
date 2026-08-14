const router = require("express").Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  getEarningsSummary,
} = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify",       verifyRazorpayPayment);

router.get("/earnings", getEarningsSummary);
router.route("/").get(getPayments).post(createPayment);
router.route("/:id").get(getPayment).patch(updatePayment);

module.exports = router;
