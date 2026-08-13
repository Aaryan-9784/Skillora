const router = require("express").Router();
const { chat, projectPlan, proposal, productivity, pricing, history, feedback } =
  require("../controllers/ai.controller");
const { protect, optionalAuth, requireAny } = require("../middlewares/auth.middleware");
const { aiLimiter } = require("../middlewares/rateLimiter");

router.use(aiLimiter);

// Streaming chat — main endpoint (requires authenticated user session for RBAC isolation)
router.post("/chat", protect, chat);

// Protected endpoints
router.post("/project-plan", protect, requireAny, projectPlan);
router.post("/proposal",     protect, requireAny, proposal);
router.get("/productivity",  protect, productivity);
router.post("/pricing",      protect, pricing);

// History & feedback
router.get("/history",            protect, history);
router.post("/feedback/:logId",   protect, feedback);

module.exports = router;
