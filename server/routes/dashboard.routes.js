const router = require("express").Router();
const { getSummary } = require("../controllers/dashboard.controller");
const { protect }    = require("../middlewares/auth.middleware");

router.get("/", protect, getSummary);

module.exports = router;
