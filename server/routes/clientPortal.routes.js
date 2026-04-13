const router = require("express").Router();
const { protect, requireClient } = require("../middlewares/auth.middleware");
const { authLimiter }            = require("../middlewares/rateLimiter");
const {
  clientLogin, acceptInvite, clientMe,
  getClientInvoices, getClientProjects,
  getClientProfile, updateClientProfile,
  getInvoiceDetail,
} = require("../controllers/clientPortal.controller");

// Public
router.post("/login",         authLimiter, clientLogin);
router.post("/accept-invite", authLimiter, acceptInvite);

// Protected (client role only)
router.use(protect, requireClient);

router.get("/me",           clientMe);
router.get("/invoices",     getClientInvoices);
router.get("/invoices/:id", getInvoiceDetail);
router.get("/projects",     getClientProjects);
router.get("/profile",      getClientProfile);
router.patch("/profile",    updateClientProfile);

module.exports = router;
