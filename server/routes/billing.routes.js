const express = require("express");
const router  = express.Router();
const { getInfo } = require("../controllers/billing.controller");
const { protect } = require("../middlewares/auth.middleware");

// All billing routes require authentication
router.use(protect);

router.get("/", getInfo);

module.exports = router;
