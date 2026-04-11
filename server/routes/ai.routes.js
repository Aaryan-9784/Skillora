const router = require("express").Router();
const { chat, projectPlan, proposal, productivity, pricing, history, feedback } =
  require("../controllers/ai.controller");
const { protect }   = require("../middlewares/auth.middleware");
const { aiLimiter } = require("../middlewares/rateLimiter");

router.use(protect);
router.use(aiLimiter);

// Streaming chat — main endpoint
router.post("/chat",        chat);

// One-shot smart commands
router.post("/project-plan", projectPlan);
router.post("/proposal",     proposal);
router.get("/productivity",  productivity);
router.post("/pricing",      pricing);

// History & feedback
router.get("/history",            history);
router.post("/feedback/:logId",   feedback);

module.exports = router;
