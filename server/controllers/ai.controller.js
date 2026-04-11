const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const aiService    = require("../services/ai.service");

/**
 * POST /api/ai/chat  (streaming)
 * Body: { messages: [{role, content}], feature?, projectId? }
 *
 * Bypasses the standard JSON response — writes SSE directly.
 */
const chat = async (req, res, next) => {
  try {
    const { messages, feature = "chat", projectId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return next(ApiError.badRequest("messages array is required"));
    }

    // Validate last message is from user
    const last = messages[messages.length - 1];
    if (last.role !== "user" || !last.content?.trim()) {
      return next(ApiError.badRequest("Last message must be a non-empty user message"));
    }

    await aiService.streamChat({
      userId:    req.user._id,
      messages,
      feature,
      projectId,
      res,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/project-plan
 * Body: { title, description }
 */
const projectPlan = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title) throw ApiError.badRequest("title is required");
  const plan = await aiService.generateProjectPlan(req.user._id, title, description);
  ApiResponse.success(res, "Project plan generated", { plan });
});

/**
 * POST /api/ai/proposal
 * Body: { clientName, projectTitle, budget, deadline }
 */
const proposal = asyncHandler(async (req, res) => {
  const { clientName, projectTitle, budget, deadline } = req.body;
  if (!clientName || !projectTitle) throw ApiError.badRequest("clientName and projectTitle are required");
  const text = await aiService.generateProposal(req.user._id, { clientName, projectTitle, budget, deadline });
  ApiResponse.success(res, "Proposal generated", { proposal: text });
});

/**
 * GET /api/ai/productivity
 */
const productivity = asyncHandler(async (req, res) => {
  const analysis = await aiService.analyzeProductivity(req.user._id);
  ApiResponse.success(res, "Productivity analysis", { analysis });
});

/**
 * POST /api/ai/pricing
 * Body: { service }
 */
const pricing = asyncHandler(async (req, res) => {
  const { service } = req.body;
  if (!service) throw ApiError.badRequest("service description is required");
  const suggestion = await aiService.suggestPricing(req.user._id, service);
  ApiResponse.success(res, "Pricing suggestion", { suggestion });
});

/**
 * GET /api/ai/history
 */
const history = asyncHandler(async (req, res) => {
  const logs = await aiService.getChatHistory(req.user._id, parseInt(req.query.limit, 10) || 50);
  ApiResponse.success(res, "Chat history", { logs });
});

/**
 * POST /api/ai/feedback/:logId
 * Body: { rating, comment }
 */
const feedback = asyncHandler(async (req, res) => {
  const log = await aiService.submitFeedback(req.params.logId, req.user._id, req.body);
  if (!log) throw ApiError.notFound("Log not found");
  ApiResponse.success(res, "Feedback saved", { log });
});

module.exports = { chat, projectPlan, proposal, productivity, pricing, history, feedback };
