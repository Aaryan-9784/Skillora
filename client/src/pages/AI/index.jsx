import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, Search, MessageSquare, PanelLeftClose, PanelLeftOpen,
  ChevronDown, Trash2, Download, Paperclip, Mic, MicOff, Globe,
  Send, Square, RotateCcw, ThumbsUp, ThumbsDown, Volume2, VolumeX, Copy,
  CheckCheck, Code, FileText, Zap, Brain, Bot, Check, X, Cpu
} from "lucide-react";
import useAiStore from "../../store/aiStore";
import useDashboardStore from "../../store/dashboardStore";
import useAuthStore from "../../store/authStore";
import useClickOutside from "../../hooks/useClickOutside";
import MarkdownMessage from "../../components/ai/MarkdownMessage";
import TypingCursor from "../../components/ai/TypingCursor";
import { getInitials } from "../../utils/helpers";
import toast from "react-hot-toast";

const AI_MODELS = [
  { id: "skillora-pro",   name: "Skillora AI Pro", desc: "Ultimate flagship copilot with maximum speed & reasoning", icon: Sparkles, color: "#A855F7", tag: "Pro Flagship" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", desc: "Fastest & most accurate workspace AI copilot", icon: Zap, color: "#635BFF", tag: "Recommended" },
  { id: "gpt-4o",         name: "GPT-4o Copilot",  desc: "Multimodal logic, complex coding & reasoning", icon: Brain, color: "#10A37F", tag: "OpenAI" },
  { id: "claude-3.5",     name: "Claude 3.5 Sonnet", desc: "Creative proposal writing & deep analysis", icon: Bot, color: "#D97706", tag: "Creative" },
  { id: "deepseek-r1",    name: "DeepSeek R1",    desc: "Chain-of-thought mathematical & code logic", icon: Code, color: "#00D4FF", tag: "Reasoning" },
  { id: "openai-o1",      name: "OpenAI o1 Reasoning", desc: "Complex problem solving, math & proofs", icon: Cpu, color: "#A78BFA", tag: "Thinking" },
  { id: "perplexity",     name: "Perplexity Sonar", desc: "Real-time web research & market citations", icon: Globe, color: "#14B8A6", tag: "Web Search" },
  { id: "llama-3.3",      name: "Llama 3.3 70B",   desc: "Open weights high performance assistant", icon: Sparkles, color: "#2563EB", tag: "Meta AI" },
];

const SUGGESTION_CARDS = [
  { label: "Plan my day", prompt: "Help me plan my day based on my current active projects and tasks", icon: "📅" },
  { label: "Create task breakdown", prompt: "Break down my current active project into actionable tasks", icon: "📋" },
  { label: "Write a proposal", prompt: "Write a professional client proposal template ready for customization", icon: "✍️" },
  { label: "Code review & refactor", prompt: "Review my code snippet for performance optimizations, security, and clean architecture", icon: "💻" },
];

const SLASH_COMMANDS = [
  { cmd: "/plan",     desc: "Generate project roadmap", prompt: "Generate a detailed project plan for my active work" },
  { cmd: "/tasks",    desc: "Break down actionable tasks", prompt: "Break down my current project into actionable tasks" },
  { cmd: "/proposal", desc: "Draft client proposal", prompt: "Draft a high-converting client proposal template" },
  { cmd: "/pricing",  desc: "Calculate service rates", prompt: "Suggest optimal hourly and project pricing rates" },
  { cmd: "/code",     desc: "Review or refactor code", prompt: "Refactor code snippet for speed and security" },
];

const PREVIOUS_SESSIONS = [
  {
    id: "session-task-breakdown",
    title: "Project Task Breakdown",
    group: "Today",
    messages: [
      { id: "p1", role: "user", content: "Break down my active project into actionable tasks", ts: Date.now() - 3600000 },
      {
        id: "p2",
        role: "assistant",
        content: `### 📋 Active Project Task Breakdown\n\nHere is your comprehensive task breakdown based on active project goals:\n\n#### 1. Requirements & Architecture\n- **Setup Core Models**: Define schema for Projects, Tasks, and Clients.\n- **API Authentication**: Secure JWT endpoints & role-based middleware.\n\n#### 2. User Interface & Frontend\n- **Dashboard & Workspace**: Responsive glassmorphism cards and metrics.\n- **Real-Time Chat & WebRTC**: Direct messaging, voice notes, and video calling.\n\n#### 3. QA & Deployment\n- **End-to-End Verification**: Test all core workflows.\n- **Production Build**: Deploy server & client.`,
        ts: Date.now() - 3500000
      }
    ]
  },
  {
    id: "session-proposal-draft",
    title: "Client Proposal Draft",
    group: "Yesterday",
    messages: [
      { id: "p3", role: "user", content: "Draft a high-converting client proposal for full-stack web app", ts: Date.now() - 86400000 },
      {
        id: "p4",
        role: "assistant",
        content: `### ✍️ High-Converting Client Proposal\n\n**Client:** Enterprise Workspace Partner  \n**Estimated Budget:** ₹75,000  \n**Timeline:** 3 Weeks  \n\n#### Executive Summary\nWe will deliver a custom full-stack web application featuring real-time messaging, project tracking, and invoice generation.\n\n#### Milestones\n1. **Milestone 1 (Week 1):** UI/UX Design & Frontend Layout — ₹25,000\n2. **Milestone 2 (Week 2):** Backend API & Database — ₹25,000\n3. **Milestone 3 (Week 3):** WebRTC & Deployment — ₹25,000`,
        ts: Date.now() - 86300000
      }
    ]
  },
  {
    id: "session-pricing-calc",
    title: "Pricing Strategy Calculator",
    group: "Previous 7 Days",
    messages: [
      { id: "p5", role: "user", content: "Calculate recommended freelance rates and pricing strategy", ts: Date.now() - 259200000 },
      {
        id: "p6",
        role: "assistant",
        content: `### 💡 Freelance Rate & Pricing Strategy\n\nBased on current market demand and developer skill level:\n\n- **Recommended Hourly Rate:** ₹1,800 / hr\n- **Fixed-Price Standard Scope:** ₹45,000 – ₹90,000\n- **Monthly Retainer Rate:** ₹50,000 / month per client\n\n> 💡 *Tip: Charge value-based pricing for high-impact clients!*`,
        ts: Date.now() - 259100000
      }
    ]
  },
  {
    id: "session-security-review",
    title: "Code Security Review",
    group: "Previous 7 Days",
    messages: [
      { id: "p7", role: "user", content: "Perform code security and architecture review", ts: Date.now() - 432000000 },
      {
        id: "p8",
        role: "assistant",
        content: `### 💻 Code Security Audit Report\n\n\`\`\`javascript\n// Secure CORS & Authorization Headers\nconst corsOptions = {\n  origin: process.env.CLIENT_URL || "http://localhost:5173",\n  credentials: true,\n};\n\`\`\`\n\n- **Authentication**: JWT token storage with HttpOnly cookies.\n- **Input Validation**: Joi/Zod schema validation on all POST/PUT routes.\n- **Rate Limiting**: Protect endpoints from brute-force attacks.`,
        ts: Date.now() - 431900000
      }
    ]
  }
];

const AI = () => {
  const { user } = useAuthStore();
  const { messages, isStreaming, sendMessage, clearChat, loadSession } = useAiStore();
  const { fetchSummary } = useDashboardStore();

  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [activeSessionId, setActiveSessionId] = useState("current");
  const [selectedModel, setSelectedModel]     = useState(() => {
    try {
      const savedModelId = localStorage.getItem("skillora_selected_model");
      if (savedModelId) {
        const found = AI_MODELS.find(m => m.id === savedModelId);
        if (found) return found;
      }
    } catch (e) {}
    return AI_MODELS[0];
  });

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    try {
      localStorage.setItem("skillora_selected_model", model.id);
    } catch (e) {}
  };

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [input, setInput]                     = useState("");
  const [webSearchEnabled, setWebSearch]      = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isListening, setIsListening]         = useState(false);
  const [speakingMsgId, setSpeakingMsgId]     = useState(null);
  const [copiedMsgId, setCopiedMsgId]         = useState(null);
  const [feedbackState, setFeedbackState]     = useState({});
  const [searchHistory, setSearchHistory]     = useState("");
  const [slashSuggestions, setSlashSuggestions] = useState([]);
  const [attachedFile, setAttachedFile]       = useState(null);

  const [sessionsList, setSessionsList]       = useState(() => {
    try {
      const saved = localStorage.getItem("skillora_ai_sessions");
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return PREVIOUS_SESSIONS;
  });

  const fileInputRef     = useRef(null);
  const messagesEndRef   = useRef(null);
  const textareaRef      = useRef(null);
  const modelDropdownRef = useRef(null);
  const slashRef         = useRef(null);

  useClickOutside(modelDropdownRef, () => setModelDropdownOpen(false), { enabled: modelDropdownOpen });
  useClickOutside(slashRef, () => setSlashSuggestions([]), { enabled: slashSuggestions.length > 0 });

  useEffect(() => {
    fetchSummary().catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    setInput(val);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleSend = (overridePrompt) => {
    const text = overridePrompt || input.trim();
    if (!text || isStreaming) return;

    let finalPrompt = text;
    if (webSearchEnabled) {
      finalPrompt = `[Live Web Search Enabled] ${text}`;
    }
    if (attachedFile) {
      finalPrompt = `[Attachment: ${attachedFile.name}]\n${finalPrompt}`;
    }

    // Always route through Gemini Pro free model behind the scenes
    sendMessage(finalPrompt, "chat", null, "gemini-1.5-pro");
    setInput("");
    setAttachedFile(null);
    setSlashSuggestions([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleNewChat = () => {
    clearChat();
    setActiveSessionId("current");
    setInput("");
    setAttachedFile(null);
    setSlashSuggestions([]);
    textareaRef.current?.focus();
    toast.success("Started new chat session");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSpeakMessage = (msgId, text) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
      return;
    }
    if (!window.speechSynthesis) {
      toast.error("Speech synthesis not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ""));
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMsgId(msgId);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      window._recognitionInstance?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      window._recognitionInstance = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join("");
        setInput(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      toast.success(`Attached ${file.name}`);
    }
  };

  const handleExportChat = () => {
    const textContent = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}\n`).join("\n---\n\n");
    const blob = new Blob([textContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Skillora_ChatGPT_${Date.now()}.md`;
    a.click();
    toast.success("Chat log exported as Markdown");
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    setSessionsList(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem("skillora_ai_sessions", JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    if (activeSessionId === id) {
      handleNewChat();
    }
    toast.success("Chat session deleted");
  };

  const handleRegenerateLast = (lastMsgContent) => {
    if (!lastMsgContent || isStreaming) return;
    sendMessage(lastMsgContent, "chat", null, "gemini-1.5-pro");
  };

  const isEmptyChat = messages.length <= 1;
  const groups = ["Today", "Yesterday", "Previous 7 Days"];

  // Render ChatGPT Prompt Input Box
  const renderInputBox = (isCentered = false) => (
    <div className={`w-full ${isCentered ? "max-w-2xl mx-auto" : "max-w-3xl lg:max-w-4xl mx-auto"}`}>

      {/* Attachment Preview Chip */}
      {attachedFile && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-xs text-indigo-300 w-fit mb-2">
          <FileText size={14} />
          <span className="font-bold truncate max-w-xs">{attachedFile.name}</span>
          <button onClick={() => setAttachedFile(null)} className="hover:text-white cursor-pointer ml-1">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Floating Input Toolbar Box */}
      <div className="relative flex items-end gap-2 p-3 rounded-2xl bg-[#111726] border border-slate-700/60 focus-within:border-indigo-500/60 transition-all shadow-2xl">
        
        {/* Hidden File Input */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        {/* File Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          title="Attach File"
        >
          <Paperclip size={18} />
        </button>

        {/* Live Web Search Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setWebSearch(!webSearchEnabled);
            toast.success(webSearchEnabled ? "Live Web Search Disabled" : "Live Web Search Enabled");
          }}
          className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-bold ${
            webSearchEnabled
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Toggle Live Web Search"
        >
          <Globe size={18} />
          {webSearchEnabled && <span className="hidden sm:inline text-[10px]">Search On</span>}
        </button>

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            isListening
              ? "bg-red-600 text-white animate-pulse"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title={isListening ? "Listening... Click to stop" : "Voice Input"}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Textarea Prompt Field */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Skillora AI..."
          rows={1}
          className="flex-1 bg-transparent text-xs lg:text-sm text-white placeholder-slate-500 outline-none resize-none max-h-40 py-1.5"
        />

        {/* Send / Stop Generation Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={() => {}}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer shrink-0 shadow-lg shadow-red-600/20"
            title="Stop Generating"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() && !attachedFile}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Send size={16} />
          </button>
        )}
      </div>

      {!isCentered && (
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 font-medium mt-2">
          <span>Enter to send • Shift+Enter for newline</span>
          <span>Skillora AI can make mistakes. Verify important information.</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 relative overflow-hidden font-sans select-none"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] w-full mx-auto flex flex-col space-y-4 min-h-0 flex-1 overflow-hidden">

        {/* ── Page Header (100% Identical to Messages / Projects Layout) ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{ background: "linear-gradient(135deg,#FFFFFF 30%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI Studio
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Smart AI workspace copilot powered by Google Gemini Pro & OpenAI models
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleSelectModel(AI_MODELS[0]);
                toast.success("Activated Skillora AI Pro model!");
              }}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.3)" }}
            >
              <Sparkles size={14} /> Skillora AI Pro
            </button>
          </div>
        </motion.div>

        {/* ── Main Layout Container (100% Identical to Messages / Projects Layout) ── */}
        <div className="rounded-3xl border border-slate-800/80 bg-[#0B101F]/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden flex-1 min-h-0 relative z-10">

        {/* ── Top Clean Header Bar (Authentic ChatGPT Style) ── */}
        <header className="h-14 px-4 bg-[#0E1424]/90 border-b border-slate-800/80 flex items-center justify-between shrink-0 z-30 backdrop-blur-xl">
        
        {/* Left: Sidebar Toggle & Clean Model Selector */}
        <div className="flex items-center gap-2" ref={modelDropdownRef}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          {/* Model Selector Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="px-3 py-1.5 rounded-xl hover:bg-slate-800/70 text-sm font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <selectedModel.icon size={16} style={{ color: selectedModel.color }} />
              <span className="font-bold text-slate-100 text-xs lg:text-sm">{selectedModel.name}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Model Dropdown Menu */}
            <AnimatePresence>
              {modelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute left-0 top-11 w-80 max-h-[400px] overflow-y-auto p-2 bg-[#121829] border border-slate-700/80 rounded-2xl shadow-2xl z-50 space-y-1 backdrop-blur-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Model Intelligence
                  </div>
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        handleSelectModel(model);
                        setModelDropdownOpen(false);
                        toast.success(`Switched model to ${model.name}`);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-start gap-3 transition-all text-left cursor-pointer ${
                        selectedModel.id === model.id
                          ? "bg-indigo-600/20 border border-indigo-500/40 text-white shadow-md shadow-indigo-500/10"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <model.icon size={18} className="mt-0.5 shrink-0" style={{ color: model.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{model.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {model.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{model.desc}</p>
                      </div>
                    </button>
                  ))}
                  {/* Embedded Upgrade Card Footer in Dropdown */}
                  <div className="pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        handleSelectModel(AI_MODELS[0]);
                        setModelDropdownOpen(false);
                        toast.success("Activated Skillora AI Pro model!");
                      }}
                      className="w-full p-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-purple-400" /> Skillora AI Pro
                      </span>
                      <span className="text-[10px] text-indigo-200 underline">Select Model</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Temporary Chat Toggle */}
          <button
            onClick={() => {
              const next = !isTemporaryChat;
              setIsTemporaryChat(next);
              toast.success(next ? "Temporary chat enabled — this chat won't be saved to history" : "Temporary chat disabled");
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isTemporaryChat
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm"
                : "bg-slate-900 border border-slate-700/60 hover:border-slate-600 text-slate-300"
            }`}
            title="Toggle Temporary Chat"
          >
            <MessageSquare size={14} className={isTemporaryChat ? "text-amber-400" : "text-slate-400"} />
            <span>Temporary chat</span>
          </button>

          {/* Upgraded Export Markdown Log Button */}
          <button
            onClick={handleExportChat}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm"
            title="Export Markdown Log"
          >
            <Download size={16} />
          </button>

          {/* Upgraded Delete/Clear Chat Button */}
          <button
            onClick={() => { clearChat(); toast.success("Cleared conversation"); }}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 bg-slate-900/60 hover:bg-red-500/15 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer shadow-sm"
            title="Clear Chat Messages"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* ── Main Layout Body ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ── Left Collapsible ChatGPT History Sidebar ── */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 270, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0D121F] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden z-20"
            >
              {/* Sidebar Header Buttons */}
              <div className="p-3 space-y-2 border-b border-slate-800/60 shrink-0">
                <button
                  onClick={handleNewChat}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-indigo-500/20 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <Plus size={16} /> New Chat
                  </span>
                  <Sparkles size={14} className="text-purple-200 group-hover:rotate-12 transition-transform" />
                </button>

                {/* Search History */}
                <div className="relative flex items-center">
                  <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchHistory}
                    onChange={(e) => setSearchHistory(e.target.value)}
                    placeholder="Search history..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 text-xs placeholder-slate-500 outline-none focus:border-indigo-500/60"
                  />
                </div>
              </div>

              {/* Categorized Conversations List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                
                {/* Active Session */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2">Active Session</span>
                  <button
                    onClick={() => setActiveSessionId("current")}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-left transition-all cursor-pointer ${
                      activeSessionId === "current"
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-white shadow-md shadow-indigo-500/10"
                        : "hover:bg-slate-800/50 text-slate-300"
                    }`}
                  >
                    <MessageSquare size={15} className="text-indigo-400 shrink-0" />
                    <span className="truncate flex-1">Current Workspace Session</span>
                  </button>
                </div>

                {/* Grouped History Sessions */}
                {groups.map((group) => {
                  const items = sessionsList.filter(
                    s => s.group === group && s.title.toLowerCase().includes(searchHistory.toLowerCase())
                  );
                  if (items.length === 0) return null;

                  return (
                    <div key={group} className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2">{group}</span>
                      {items.map((sess) => {
                        const isSel = activeSessionId === sess.id;
                        return (
                          <div
                            key={sess.id}
                            onClick={() => {
                              setActiveSessionId(sess.id);
                              loadSession(sess.messages);
                              toast.success(`Loaded session: ${sess.title}`);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition-all cursor-pointer group ${
                              isSel
                                ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                                : "hover:bg-slate-800/50 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <MessageSquare size={14} className={`shrink-0 ${isSel ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-400"}`} />
                              <span className="truncate">{sess.title}</span>
                            </div>

                            <button
                              onClick={(e) => handleDeleteSession(e, sess.id)}
                              className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete session"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Sidebar Footer User Profile Card */}
              <div className="p-3.5 border-t border-slate-800/80 bg-[#0B0F1B]/95 flex items-center justify-between shrink-0">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity cursor-pointer group"
                  title="View Profile"
                >
                  <div
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{
                      background: user?.avatar ? "transparent" : "linear-gradient(135deg,#635BFF,#8579FF)",
                      boxShadow: "0 0 14px rgba(99,91,255,0.4)"
                    }}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-sm font-extrabold">{getInitials(user?.name)}</span>
                    )}
                    {/* Glowing Green Online Status Indicator */}
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B0F1B]"
                      style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center text-left">
                    <p className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors truncate leading-tight">
                      {user?.name || "Aryan Patel"}
                    </p>
                    <p className="text-xs font-semibold text-purple-400 capitalize leading-tight mt-0.5 truncate">
                      {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "Freelancer"}
                    </p>
                  </div>
                </Link>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Chat Stream & Input Workspace ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#090D16] relative overflow-hidden">

          {/* Temporary Chat Notice Banner */}
          {isTemporaryChat && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2 shrink-0">
              <MessageSquare size={14} className="text-amber-400 shrink-0" />
              <span>Temporary chat — Conversations in this mode won't be saved to history.</span>
            </div>
          )}

          {/* ── Messages Feed / Authentic ChatGPT Welcome State ── */}
          <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            
            {isEmptyChat ? (
              <div className="h-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6 my-auto py-8">
                
                {/* Clean ChatGPT Style Icon & Hero Greeting */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 mb-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                    <Sparkles size={24} />
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    What can I help with today, {user?.name ? user.name.split(" ")[0] : "Aryan"}?
                  </h1>
                </motion.div>

                {/* Centered ChatGPT Prompt Input Box */}
                {renderInputBox(true)}

              </div>
            ) : (
              /* Active Chat Stream List */
              <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-6">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 mt-1">
                        {isUser ? (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {getInitials(user?.name)}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                            <Sparkles size={16} />
                          </div>
                        )}
                      </div>

                      {/* Content Bubble */}
                      <div className={`flex flex-col gap-2 ${isUser ? "items-end max-w-[80%]" : "items-start max-w-[88%] min-w-0 flex-1"}`}>
                        
                        <div
                          className={`p-4 rounded-2xl text-xs lg:text-sm leading-relaxed ${
                            isUser
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20"
                              : "bg-[#111625] text-slate-100 rounded-tl-none border border-slate-800/90 shadow-xl"
                          }`}
                        >
                          {msg.streaming && !msg.content ? (
                            <div className="flex items-center gap-1.5 py-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]" />
                            </div>
                          ) : (
                            <>
                              <MarkdownMessage content={msg.content} />
                              {msg.streaming && <TypingCursor />}
                            </>
                          )}
                        </div>

                        {/* Assistant Response Actions Bar */}
                        {!isUser && !msg.streaming && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 px-1 pt-1">
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedMsgId === msg.id ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              <span>{copiedMsgId === msg.id ? "Copied" : "Copy"}</span>
                            </button>

                            <button
                              onClick={() => handleSpeakMessage(msg.id, msg.content)}
                              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {speakingMsgId === msg.id ? <VolumeX size={14} className="text-indigo-400" /> : <Volume2 size={14} />}
                              <span>{speakingMsgId === msg.id ? "Stop Voice" : "Read Aloud"}</span>
                            </button>

                            <button
                              onClick={() => {
                                const prevUserMsg = messages[index - 1];
                                if (prevUserMsg?.role === "user") {
                                  handleRegenerateLast(prevUserMsg.content);
                                }
                              }}
                              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw size={14} />
                              <span>Regenerate</span>
                            </button>

                            {/* Thumbs Up / Down Feedback */}
                            <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-3">
                              <button
                                onClick={() => setFeedbackState(prev => ({ ...prev, [msg.id]: "up" }))}
                                className={`p-1 hover:text-emerald-400 transition-colors cursor-pointer ${feedbackState[msg.id] === "up" ? "text-emerald-400" : ""}`}
                              >
                                <ThumbsUp size={13} />
                              </button>
                              <button
                                onClick={() => setFeedbackState(prev => ({ ...prev, [msg.id]: "down" }))}
                                className={`p-1 hover:text-red-400 transition-colors cursor-pointer ${feedbackState[msg.id] === "down" ? "text-red-400" : ""}`}
                              >
                                <ThumbsDown size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Bottom Prompt Box (Active Stream Mode) ── */}
          {!isEmptyChat && (
            <div className="p-4 border-t border-slate-800/80 bg-[#0B0F1A]/95 shrink-0 relative z-20">
              {renderInputBox(false)}
            </div>
          )}

        </main>
      </div>

      {/* Close Outer Card Container */}
      </div>

      </div>

    </div>
  );
};

export default AI;
