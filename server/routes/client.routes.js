const router = require("express").Router();
const {
  createClient, getClients, getClient, updateClient, deleteClient, getRevenueStats, inviteToPortal,
} = require("../controllers/client.controller");
const { protect, requireFreelancer } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/revenue-stats", getRevenueStats);
router.route("/").get(getClients).post(createClient);
router.route("/:id").get(getClient).patch(updateClient).delete(deleteClient);
router.post("/:id/invite", protect, requireFreelancer, inviteToPortal);

module.exports = router;
