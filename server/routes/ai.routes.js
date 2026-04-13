const router = require("express").Router();
const { chat, projectPlan, proposal, productivity, pricing, history, feedback } =
  require("../controllers/ai.controller");
const { protect, requireFreelancer } = require("../middlewares/auth.middleware");
const { aiLimiter } = require("../middlewares/rateLimiter");
const { planGate }  = require("../middlewares/planGate");

router.use(protect);
router.use(aiLimiter);

// Streaming chat — main endpoint
router.post("/chat",        requireFreelancer, planGate("pro"), chat);

// One-shot smart commands
router.post("/project-plan", requireFreelancer, planGate("pro"), projectPlan);
router.post("/proposal",     requireFreelancer, planGate("pro"), proposal);
router.get("/productivity",  productivity);
router.post("/pricing",      pricing);

// History & feedback
router.get("/history",            history);
router.post("/feedback/:logId",   feedback);

module.exports = router;
