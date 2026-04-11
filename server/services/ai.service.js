const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const AiLog   = require("../models/AiLog");
const Project = require("../models/Project");
const Task    = require("../models/Task");
const Invoice = require("../models/Invoice");
const Skill   = require("../models/Skill");
const logger  = require("../utils/logger");

// ── Gemini client (lazy init) ─────────────────────────────
let _genAI = null;

const getClient = () => {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
};

const MODEL_NAME = () => process.env.GEMINI_MODEL || "gemini-1.5-pro";

// Safety settings — permissive for business content
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const GENERATION_CONFIG = {
  temperature:     0.7,
  topK:            40,
  topP:            0.95,
  maxOutputTokens: 2048,
};

// ── System prompt ─────────────────────────────────────────
const SYSTEM_PROMPT = `You are Skillora AI — a smart productivity assistant built into a freelancer management platform.
You help freelancers with:
- Project planning and task breakdown
- Client proposals and professional writing
- Pricing strategy and business advice
- Productivity analysis and insights
- Invoice and contract writing

Be concise, practical, and actionable. Format responses with markdown when helpful.
When given user context (projects, tasks, skills), use it to give personalized advice.`;

// ── Context engine ────────────────────────────────────────
/**
 * Fetch user's workspace data and compress it into a context string.
 * Injected into every AI request for personalized responses.
 */
const buildUserContext = async (userId) => {
  try {
    const [projects, tasks, invoices, skills] = await Promise.all([
      Project.find({ owner: userId, isDeleted: { $ne: true } })
        .select("title status budget deadline progress taskStats")
        .sort("-createdAt").limit(10).lean(),
      Task.find({ owner: userId, status: { $in: ["todo", "in_progress"] }, isDeleted: { $ne: true } })
        .select("title status priority dueDate")
        .sort("dueDate").limit(15).lean(),
      Invoice.find({ owner: userId, isDeleted: { $ne: true } })
        .select("total status currency createdAt")
        .sort("-createdAt").limit(5).lean(),
      Skill.find({ owner: userId })
        .select("name level levelLabel category").lean(),
    ]);

    const activeProjects    = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter((p) => p.status === "completed").length;
    const overdueTasks      = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
    const totalRevenue      = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);

    const lines = [
      `## User Workspace Context`,
      `- Projects: ${projects.length} total (${activeProjects} active, ${completedProjects} completed)`,
      `- Open tasks: ${tasks.length} (${overdueTasks.length} overdue)`,
      `- Skills: ${skills.map((s) => `${s.name} (${s.levelLabel})`).join(", ") || "none listed"}`,
      `- Recent revenue: ₹${totalRevenue.toFixed(0)} from ${invoices.filter((i) => i.status === "paid").length} paid invoices`,
    ];

    if (projects.length > 0) {
      lines.push(`\n### Active Projects`);
      projects.slice(0, 5).forEach((p) => {
        lines.push(`- "${p.title}" — ${p.status}, ${p.progress}% complete, budget ₹${p.budget}`);
      });
    }

    if (overdueTasks.length > 0) {
      lines.push(`\n### Overdue Tasks`);
      overdueTasks.slice(0, 5).forEach((t) => {
        lines.push(`- "${t.title}" (${t.priority} priority)`);
      });
    }

    return lines.join("\n");
  } catch (err) {
    logger.error(`Context build failed: ${err.message}`);
    return "User context unavailable.";
  }
};

// ── Log AI interaction ────────────────────────────────────
const logInteraction = async ({ owner, feature, prompt, response, tokensUsed, model, durationMs, projectId }) => {
  try {
    await AiLog.create({ owner, feature, prompt, response, tokensUsed, model, durationMs, projectId: projectId || null });
  } catch (err) {
    logger.error(`AI log failed: ${err.message}`);
  }
};

// ── Convert message history to Gemini format ──────────────
/**
 * Gemini uses { role: "user"|"model", parts: [{text}] }
 * OpenAI-style "assistant" → Gemini "model"
 * System messages are prepended to the first user message.
 */
const toGeminiHistory = (messages, systemContext) => {
  const history = [];

  messages.forEach((m, i) => {
    const role = m.role === "assistant" ? "model" : "user";
    let text   = m.content;

    // Prepend system context to the very first user message
    if (i === 0 && role === "user" && systemContext) {
      text = `${systemContext}\n\n---\n\n${text}`;
    }

    // Gemini requires alternating user/model turns
    // Merge consecutive same-role messages
    const last = history[history.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${text}`;
    } else {
      history.push({ role, parts: [{ text }] });
    }
  });

  return history;
};

// ── Core: streaming chat ──────────────────────────────────
/**
 * Stream a Gemini response via Server-Sent Events.
 */
const streamChat = async ({ userId, messages, feature = "chat", projectId, res }) => {
  const start = Date.now();

  // SSE headers
  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let fullResponse = "";
  let tokensUsed   = { prompt: 0, completion: 0, total: 0 };

  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model:            MODEL_NAME(),
      safetySettings:   SAFETY_SETTINGS,
      generationConfig: GENERATION_CONFIG,
    });

    // Build context
    const userContext = await buildUserContext(userId);
    const systemCtx   = `${SYSTEM_PROMPT}\n\n${userContext}`;

    // Split history (all but last) from the current prompt
    const history     = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];

    const geminiHistory = toGeminiHistory(history, systemCtx);

    // Start chat session with history
    const chat = model.startChat({
      history:          geminiHistory,
      generationConfig: GENERATION_CONFIG,
      safetySettings:   SAFETY_SETTINGS,
    });

    // Prepend system context to first message if no history
    const userText = geminiHistory.length === 0
      ? `${systemCtx}\n\n---\n\n${lastMessage.content}`
      : lastMessage.content;

    const streamResult = await chat.sendMessageStream(userText);

    for await (const chunk of streamResult.stream) {
      const delta = chunk.text();
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`);
      }
    }

    // Get usage metadata from final response
    const finalResponse = await streamResult.response;
    const usage = finalResponse.usageMetadata;
    if (usage) {
      tokensUsed = {
        prompt:     usage.promptTokenCount     || 0,
        completion: usage.candidatesTokenCount || 0,
        total:      usage.totalTokenCount      || 0,
      };
    }

    const durationMs = Date.now() - start;
    res.write(`data: ${JSON.stringify({ type: "done", durationMs, tokensUsed })}\n\n`);
    res.end();

    // Persist log async
    const userPrompt = lastMessage?.content || "";
    logInteraction({
      owner: userId, feature, prompt: userPrompt, response: fullResponse,
      tokensUsed, model: MODEL_NAME(), durationMs, projectId,
    });

  } catch (err) {
    logger.error(`Gemini stream error: ${err.message}`);
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
    res.end();
  }
};

// ── Non-streaming single completion ──────────────────────
/**
 * Single-shot Gemini completion — returns plain string.
 */
const complete = async (prompt, systemOverride) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model:            MODEL_NAME(),
    safetySettings:   SAFETY_SETTINGS,
    generationConfig: { ...GENERATION_CONFIG, maxOutputTokens: 1500 },
  });

  const fullPrompt = `${systemOverride || SYSTEM_PROMPT}\n\n---\n\n${prompt}`;
  const result     = await model.generateContent(fullPrompt);
  return result.response.text().trim();
};

// ── Smart commands ────────────────────────────────────────

const suggestTasks = async (projectTitle, projectDescription) => {
  if (!process.env.GEMINI_API_KEY) {
    return [
      { title: "Define project scope",           priority: "high" },
      { title: "Set up development environment", priority: "high" },
      { title: "Create initial wireframes",      priority: "medium" },
      { title: "Implement core features",        priority: "high" },
      { title: "Testing & QA",                   priority: "medium" },
      { title: "Deployment",                     priority: "medium" },
    ];
  }

  const prompt = `Break down this freelance project into 6-8 actionable tasks.
Project: "${projectTitle}"
Description: "${projectDescription || "No description provided"}"

Return ONLY a JSON array like:
[{"title":"Task name","priority":"high|medium|low","estimatedHours":2}]
No markdown, no explanation — just the raw JSON array.`;

  try {
    const raw  = await complete(prompt);
    const json = raw.replace(/```json?|```/g, "").trim();
    return JSON.parse(json);
  } catch {
    return [{ title: "Define project scope", priority: "high" }];
  }
};

const generateProjectPlan = async (userId, projectTitle, projectDescription) => {
  const context = await buildUserContext(userId);
  return complete(
    `Create a detailed project plan for: "${projectTitle}"\nDescription: ${projectDescription || "N/A"}\n\n${context}`,
    `${SYSTEM_PROMPT}\n\nFormat the plan with sections: Overview, Milestones, Timeline, Risks, Budget Considerations.`
  );
};

const generateProposal = async (userId, { clientName, projectTitle, budget, deadline }) => {
  const context = await buildUserContext(userId);
  return complete(
    `Write a professional client proposal for:
Client: ${clientName}
Project: ${projectTitle}
Budget: ₹${budget}
Deadline: ${deadline}

${context}`,
    `${SYSTEM_PROMPT}\n\nWrite a professional, persuasive proposal. Include: Introduction, Scope of Work, Timeline, Investment, Next Steps.`
  );
};

const analyzeProductivity = async (userId) => {
  const context = await buildUserContext(userId);
  return complete(
    `Analyze my freelance productivity and give me 5 specific, actionable insights.\n\n${context}`,
    `${SYSTEM_PROMPT}\n\nBe direct and specific. Use the actual data provided. Format as numbered insights with a brief explanation each.`
  );
};

const suggestPricing = async (userId, serviceDescription) => {
  const context = await buildUserContext(userId);
  return complete(
    `Suggest pricing for this freelance service: "${serviceDescription}"\n\n${context}`,
    `${SYSTEM_PROMPT}\n\nProvide hourly rate, project rate, and retainer options with market context. Use INR (₹) for pricing.`
  );
};

const generateInvoiceSummary = async (invoiceData) => {
  if (!process.env.GEMINI_API_KEY) {
    return `Professional invoice for ${invoiceData.clientName}. Total: ₹${invoiceData.total}.`;
  }
  return complete(
    `Write a brief, professional invoice cover note for:
Client: ${invoiceData.clientName}
Total: ₹${invoiceData.total} ${invoiceData.currency}
Items: ${invoiceData.items?.map((i) => i.description).join(", ")}`
  );
};

const suggestProjectDescription = async (title) => {
  if (!process.env.GEMINI_API_KEY) {
    return `Project: ${title}. Add your GEMINI_API_KEY to enable AI descriptions.`;
  }
  return complete(`Write a concise 2-sentence project description for a freelance project titled: "${title}"`);
};

// ── Chat history ──────────────────────────────────────────
const getChatHistory = async (userId, limit = 50) => {
  return AiLog.find({ owner: userId, feature: "chat" })
    .select("prompt response createdAt tokensUsed durationMs feedback")
    .sort("-createdAt")
    .limit(limit)
    .lean();
};

const submitFeedback = async (logId, userId, { rating, comment }) => {
  return AiLog.findOneAndUpdate(
    { _id: logId, owner: userId },
    { "feedback.rating": rating, "feedback.comment": comment },
    { new: true }
  );
};

module.exports = {
  streamChat,
  suggestTasks,
  generateProjectPlan,
  generateProposal,
  analyzeProductivity,
  suggestPricing,
  generateInvoiceSummary,
  suggestProjectDescription,
  getChatHistory,
  submitFeedback,
  buildUserContext,
};
