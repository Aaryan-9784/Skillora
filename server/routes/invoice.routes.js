const router = require("express").Router();
const {
  createInvoice, getInvoices, getInvoice, updateInvoice, deleteInvoice,
  getRevenueAnalytics, getOutstandingBalance,
  updateStatus, sendInvoice, duplicateInvoice,
} = require("../controllers/invoice.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/analytics",   getRevenueAnalytics);
router.get("/outstanding", getOutstandingBalance);
router.route("/").get(getInvoices).post(createInvoice);
router.route("/:id").get(getInvoice).patch(updateInvoice).delete(deleteInvoice);
router.patch("/:id/status",   updateStatus);
router.post("/:id/send",      sendInvoice);
router.post("/:id/duplicate", duplicateInvoice);

module.exports = router;
