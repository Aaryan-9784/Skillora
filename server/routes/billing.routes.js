const express = require("express");
const router  = express.Router();
const {
  getInfo, subscribe, verifyPayment, cancelSubscription, webhook,
} = require("../controllers/billing.controller");
const { protect } = require("../middlewares/auth.middleware");

// Razorpay webhook — raw body required for HMAC verification
// Must be registered BEFORE express.json() parses the body
router.post("/webhook", express.raw({ type: "application/json" }), webhook);

// All other billing routes require auth
router.use(protect);

router.get("/",          getInfo);
router.post("/subscribe", subscribe);
router.post("/verify",    verifyPayment);
router.post("/cancel",    cancelSubscription);

module.exports = router;
