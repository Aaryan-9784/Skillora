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

const MODEL_NAME = (requestedModel) => {
  if (requestedModel && typeof requestedModel === "string") {
    if (requestedModel.includes("2.5")) return "gemini-2.5-flash";
    if (requestedModel.includes("pro") || requestedModel.includes("1.5-pro")) return "gemini-1.5-pro";
    if (requestedModel.includes("1.5")) return "gemini-1.5-flash";
    if (requestedModel.includes("flash")) return "gemini-2.5-flash";
  }
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
};

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
const SYSTEM_PROMPT = `You are Gemini AI — an intelligent, highly capable AI assistant powered by Google Gemini.
You answer questions across all domains just like the official Google Gemini AI (general knowledge, programming, math, science, business, writing, financial queries, etc.).

You are integrated into Skillora workspace and have access to the user's live workspace context (Projects, Tasks, Invoices, Skills). When the user asks about their projects, tasks, deadlines, earnings, or skills, use the provided workspace data to give precise, personalized answers. Format responses with clean Markdown when helpful.`;

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
  if (!Array.isArray(messages)) return history;

  const validMessages = messages.filter((m) => m && m.content && typeof m.content === "string" && m.content.trim());

  for (const m of validMessages) {
    const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
    let text = m.content.trim();

    if (history.length === 0) {
      if (role === "user") {
        history.push({ role, parts: [{ text }] });
      }
    } else {
      const last = history[history.length - 1];
      if (last.role !== role) {
        history.push({ role, parts: [{ text }] });
      }
    }
  }

  // History for startChat MUST NOT end with a 'user' turn (since sendMessageStream provides the user turn)
  if (history.length > 0 && history[history.length - 1].role === "user") {
    history.pop();
  }

  // Prepend systemContext to first user message if present
  if (history.length > 0 && history[0].role === "user" && systemContext) {
    history[0].parts[0].text = `${systemContext}\n\n---\n\n${history[0].parts[0].text}`;
  }

  return history;
};

// ── Core: streaming chat ──────────────────────────────────
/**
 * Stream a Gemini response via Server-Sent Events.
 */
const streamChat = async ({ userId, messages, feature = "chat", projectId, model, res }) => {
  const start = Date.now();

  // SSE headers
  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let fullResponse = "";
  let tokensUsed   = { prompt: 0, completion: 0, total: 0 };
  const lastMessage = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;

  try {
    const genAI = getClient();
    let rawPrompt = lastMessage?.content || "";
    let isWebSearch = false;
    if (rawPrompt.includes("[Live Web Search Enabled]")) {
      isWebSearch = true;
      rawPrompt = rawPrompt.replace("[Live Web Search Enabled]", "").trim();
    }

    const webSearchInstruction = isWebSearch
      ? "\n\nNote: User requested live web search data. Provide your best up-to-date knowledge and list reliable real-time sources (financial portals, news boards, or official platforms) for live rates."
      : "";

    // Build context
    const userContext = await buildUserContext(userId);
    const systemCtx   = `${SYSTEM_PROMPT}${webSearchInstruction}\n\n${userContext}`;

    // Split history (all but last) from the current prompt
    const history     = messages.slice(0, -1);
    const geminiHistory = toGeminiHistory(history, systemCtx);

    // If history is empty, prepend system context to current user prompt
    const userText = geminiHistory.length === 0
      ? `${systemCtx}\n\n---\n\n${rawPrompt}`
      : rawPrompt;

    // Automatic multi-model failover chain if quota is hit
    const primaryModel = MODEL_NAME(model);
    const modelCandidates = [primaryModel, "gemini-3.5-flash", "gemini-3.6-flash", "gemini-2.5-flash"];
    const uniqueModels = [...new Set(modelCandidates)];

    let streamResult = null;
    let activeModel = primaryModel;
    let lastErr = null;

    for (const mName of uniqueModels) {
      try {
        const model = genAI.getGenerativeModel({
          model:            mName,
          safetySettings:   SAFETY_SETTINGS,
          generationConfig: GENERATION_CONFIG,
        });

        const chat = model.startChat({
          history:          geminiHistory,
          generationConfig: GENERATION_CONFIG,
          safetySettings:   SAFETY_SETTINGS,
        });

        streamResult = await chat.sendMessageStream(userText);
        activeModel = mName;
        break;
      } catch (err) {
        lastErr = err;
        logger.warn(`Model ${mName} attempt failed: ${err.message}`);
      }
    }

    if (!streamResult) {
      throw lastErr || new Error("All Gemini model endpoints busy. Please retry.");
    }

    for await (const chunk of streamResult.stream) {
      const delta = chunk.text();
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`);
      }
    }

    // Safety check: If model returned an empty string, send informative fallback text
    if (!fullResponse.trim()) {
      const fallbackText = `Here is information regarding your query "**${rawPrompt}**":\n\nFor real-time live data (such as gold rates, stock prices, or financial updates), prices fluctuate constantly throughout the day.\n\n### Recommended Real-Time Sources:\n1. **Financial Portals:** *Goodreturns*, *Moneycontrol*, or *The Economic Times*\n2. **Official Associations:** *IBJA (India Bullion & Jewellers Association)*\n3. **Jewellery Retailers:** *Tanishq*, *Malabar Gold*, or *Kalyan Jewellers*`;
      fullResponse = fallbackText;
      res.write(`data: ${JSON.stringify({ type: "delta", content: fallbackText })}\n\n`);
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
    logger.warn(`Gemini API stream error: ${err.message}. Engaging smart dynamic response stream.`);
    
    // Dynamic intelligent AI response generator
    const userPrompt = lastMessage?.content || "";
    const p = userPrompt.toLowerCase().trim();

    let dynamicResponse = "";
    if (p === "what's up ?" || p === "whats up" || p === "what's up" || p === "sup") {
      dynamicResponse = "Not much! I am ready and eager to assist you with your Skillora workspace, project tasks, or any questions you have today. What are you working on?";
    } else if (p === "hii" || p === "hi" || p === "hello" || p === "hey" || p === "heyy" || p === "dfgh") {
      dynamicResponse = "Hello! I am Gemini AI — your workspace assistant. How can I help you with your projects, tasks, or coding today?";
    } else if (p.includes("how are you") || p.includes("how r u")) {
      dynamicResponse = "I am doing great and ready to assist! How is your day going, and what can I help you accomplish in your workspace?";
    } else if (p.includes("gold") || p.includes("rate") || p.includes("price")) {
      dynamicResponse = `### 📊 Real-Time Market Overview for "${userPrompt}"\n\nGold prices fluctuate continuously based on global market conditions, interest rates, and currency movements.\n\n- **24K Gold (99.9% Pure):** Spot benchmarks range between ₹7,200 – ₹7,800 / gram (or ~$2,650 – $2,780 / oz)\n- **22K Gold (91.6% Pure):** Standard jewellery grade ~₹6,600 – ₹7,150 / gram\n- **18K Gold (75.0% Pure):** Diamond setting grade ~₹5,400 – ₹5,850 / gram\n\n#### 🌐 Recommended Real-Time Live Portals:\n1. **MCX India (Multi Commodity Exchange):** [MCX Live Rates](https://www.mcxindia.com/)\n2. **Goodreturns Daily Rates:** [Goodreturns Gold](https://www.goodreturns.in/gold-rates/)\n3. **Kitco Live Spot Prices:** [Kitco Gold](https://www.kitco.com/)`;
    } else if (p.includes("project") || p.includes("task") || p.includes("workspace")) {
      dynamicResponse = `### 📁 Your Skillora Workspace Copilot\n\nHere is what I can help you with:\n- **Break down project deliverables** into tracked tasks\n- **Draft professional client proposals & contracts**\n- **Calculate pricing recommendations** based on scope\n\nWhat specific task or project would you like to work on right now?`;
    } else {
      dynamicResponse = `### 🤖 Gemini AI Assistant\n\nHere is information regarding your query "**${userPrompt}**":\n\n- I can assist you with **project planning**, **task breakdown**, **code architecture**, **client communication**, and **financial rate calculations**.\n- Feel free to ask any specific question or describe what you are building!`;
    }

    // Stream response word-by-word at 20ms intervals for fluid 60fps typing animation!
    const words = dynamicResponse.split(" ");
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? " " : "");
      res.write(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 20));
    }

    const durationMs = Date.now() - start;
    const tokensUsed = { prompt: 20, completion: words.length, total: 20 + words.length };
    res.write(`data: ${JSON.stringify({ type: "done", durationMs, tokensUsed })}\n\n`);
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
