const router = require("express").Router();
const {
  createClient, getClients, getClient, updateClient, deleteClient, getRevenueStats,
} = require("../controllers/client.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/revenue-stats", getRevenueStats);
router.route("/").get(getClients).post(createClient);
router.route("/:id").get(getClient).patch(updateClient).delete(deleteClient);

module.exports = router;
