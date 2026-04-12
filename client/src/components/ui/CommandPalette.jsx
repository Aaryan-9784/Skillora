/**
 * CommandPalette — Premium AI-powered command center for Skillora.
 *
 * Dual-mode system:
 *   NORMAL MODE  — navigation + actions + live search
 *   AI MODE      — triggered by "/" — AI prompt interface
 *
 * Keyboard: ↑↓ navigate · Enter execute · ESC close · / AI mode · Cmd+K open
 */

import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FolderKanban, CheckSquare, Users, CreditCard,
  Sparkles, ArrowRight, Clock, Zap, BarChart2, FileText,
  LayoutDashboard, Settings, Lightbulb, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useClickOutside from "../../hooks/useClickOutside";
import useDebounce from "../../hooks/useDebounce";
import useAuthStore from "../../store/authStore";
import useAiStore from "../../store/aiStore";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: "projects",  icon: FolderKanban,    label: "Go to Projects",   shortcut: "P", path: "/projects",  color: "#635BFF" },
  { id: "tasks",     icon: CheckSquare,     label: "Go to Tasks",      shortcut: "T", path: "/tasks",     color: "#22C55E" },
  { id: "clients",   icon: Users,           label: "Go to Clients",    shortcut: "C", path: "/clients",   color: "#F59E0B" },
  { id: "payments",  icon: CreditCard,      label: "Go to Payments",   shortcut: "M", path: "/payments",  color: "#00D4FF" },
  { id: "dashboard", icon: LayoutDashboard, label: "Go to Dashboard",  shortcut: "D", path: "/dashboard", color: "#8B5CF6" },
  { id: "ai",        icon: Sparkles,        label: "Open AI Assistant",shortcut: "A", path: "/ai",        color: "#EC4899" },
  { id: "settings",  icon: Settings,        label: "Settings",         shortcut: "S", path: "/settings",  color: "#6B7280" },
];

const AI_SUGGESTIONS = [
  { id: "ai-plan",     icon: FolderKanban, label: "Generate project plan",   desc: "Break a project into milestones",    color: "#635BFF", prompt: "Generate a detailed project plan for my most recent active project" },
  { id: "ai-tasks",    icon: CheckSquare,  label: "Create task list",         desc: "Auto-generate tasks from project",   color: "#22C55E", prompt: "Break down my current project into specific actionable tasks with priorities" },
  { id: "ai-analyze",  icon: BarChart2,    label: "Analyze productivity",     desc: "Get 5 specific improvements",        color: "#8B5CF6", prompt: "Analyze my productivity and give me 5 specific improvements I can make" },
  { id: "ai-proposal", icon: FileText,     label: "Write proposal",           desc: "Professional client proposal",       color: "#00D4FF", prompt: "Write a professional client proposal template I can customize" },
  { id: "ai-pricing",  icon: Zap,          label: "Pricing advice",           desc: "Market-rate pricing strategy",       color: "#F59E0B", prompt: "Based on my skills and projects, what should I charge for my services?" },
  { id: "ai-insights", icon: Lightbulb,    label: "Business insights",        desc: "Growth opportunities",               color: "#EC4899", prompt: "What are the biggest opportunities to grow my freelance business right now?" },
];

// Slash command map for quick resolution
const SLASH_MAP = {
  "/plan":     AI_SUGGESTIONS[0].prompt,
  "/tasks":    AI_SUGGESTIONS[1].prompt,
  "/analyze":  AI_SUGGESTIONS[2].prompt,
  "/proposal": AI_SUGGESTIONS[3].prompt,
  "/pricing":  AI_SUGGESTIONS[4].prompt,
  "/insights": AI_SUGGESTIONS[5].prompt,
};

// Recent items — sessionStorage (no extra store needed)
const RECENT_KEY = "skillora_cmd_recent";
const getRecent  = () => { try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; } };
const saveRecent = (item) => {
  const prev = getRecent().filter((r) => r.id !== item.id).slice(0, 4);
  sessionStorage.setItem(RECENT_KEY, JSON.stringify([{ ...item, icon: null }, ...prev]));
};

// ─────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────

const SectionLabel = ({ label, isAi }) => (
  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
    {isAi && (
      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#635BFF,#EC4899)" }}>
        <Sparkles size={8} className="text-white" />
      </div>
    )}
    <p className="text-[9.5px] font-bold tracking-[0.13em] uppercase select-none"
      style={{ color: isAi ? "#635BFF" : "#374151" }}>
      {label}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────
// RESULT ITEM
// ─────────────────────────────────────────────────────────

const ResultItem = ({ item, isActive, onSelect, onHover, index }) => {
  const Icon = item.icon;

  return (
    <motion.button
      onClick={() => onSelect(item)}
      onMouseEnter={() => onHover(index)}
      className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-75"
      style={{
        background: isActive ? "rgba(99,91,255,0.12)" : "transparent",
        border:     isActive ? "1px solid rgba(99,91,255,0.2)" : "1px solid transparent",
      }}
    >


      {/* Icon */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-100"
        style={{
          background: isActive ? `${item.color || "#635BFF"}22` : "rgba(255,255,255,0.05)",
          border:     isActive ? `1px solid ${item.color || "#635BFF"}35` : "1px solid rgba(255,255,255,0.07)",
        }}>
        {Icon
          ? <Icon size={13} style={{ color: isActive ? (item.color || "#635BFF") : "#6B7280" }} strokeWidth={1.8} />
          : <span className="text-xs font-bold" style={{ color: item.color || "#6B7280" }}>
              {(item.label || "?")[0].toUpperCase()}
            </span>
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-none"
          style={{ color: isActive ? "#F9FAFB" : "#D1D5DB" }}>
          {item.label}
        </p>
        {item.desc && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "#4B5563" }}>
            {item.desc}
          </p>
        )}
        {item.sub && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "#4B5563" }}>
            {item.sub}
          </p>
        )}
      </div>

      {/* Right badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {item.typeBadge && (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${item.color || "#635BFF"}15`, color: item.color || "#635BFF", border: `1px solid ${item.color || "#635BFF"}25` }}>
            {item.typeBadge}
          </span>
        )}
        {item.shortcut && (
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{
              background: isActive ? "rgba(99,91,255,0.15)" : "rgba(255,255,255,0.05)",
              color:      isActive ? "#A78BFA" : "#4B5563",
              border:     `1px solid ${isActive ? "rgba(99,91,255,0.25)" : "rgba(255,255,255,0.07)"}`,
            }}>
            {item.shortcut}
          </kbd>
        )}
        {isActive && !item.shortcut && !item.typeBadge && (
          <ArrowRight size={12} style={{ color: item.color || "#635BFF" }} />
        )}
      </div>
    </motion.button>
  );
};

// ─────────────────────────────────────────────────────────
// SMART INPUT
// ─────────────────────────────────────────────────────────

const SmartInput = forwardRef(({ value, onChange, onKeyDown, loading, isAiMode }, ref) => (
  <div
    className="flex items-center gap-3 px-4 py-3.5 transition-all duration-200"
    style={{
      borderBottom: isAiMode
        ? "1px solid rgba(99,91,255,0.25)"
        : "1px solid rgba(255,255,255,0.06)",
    }}
  >
    {/* Left icon — morphs between search and AI sparkle */}
    <AnimatePresence mode="wait">
      {isAiMode ? (
        <motion.div key="ai-icon"
          initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#635BFF,#EC4899)", boxShadow: "0 0 12px rgba(99,91,255,0.5)" }}>
          <Sparkles size={11} className="text-white" />
        </motion.div>
      ) : loading ? (
        <motion.div key="loader"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
          style={{ borderColor: "rgba(99,91,255,0.4)", borderTopColor: "#635BFF" }} />
      ) : (
        <motion.div key="search-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Search size={16} style={{ color: "#635BFF", flexShrink: 0 }} />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Input */}
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={isAiMode ? "Ask Skillora AI anything…" : "Search projects, tasks, clients, or type / for AI…"}
      className="flex-1 bg-transparent text-sm outline-none transition-all duration-200"
      style={{
        color: "#F9FAFB",
        caretColor: isAiMode ? "#EC4899" : "#635BFF",
      }}
      autoComplete="off"
      spellCheck={false}
    />

    {/* Right hints */}
    <div className="flex items-center gap-2 shrink-0">
      {/* AI mode badge */}
      <AnimatePresence>
        {isAiMode && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 8 }}
            transition={{ duration: 0.18 }}
            className="hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
            style={{ background: "rgba(99,91,255,0.15)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
            <Sparkles size={9} />
            AI mode
          </motion.span>
        )}
        {!isAiMode && !value && (
          <motion.span
            key="slash-hint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="hidden sm:flex items-center gap-1 text-[10px] font-mono shrink-0"
            style={{ color: "#374151" }}>
            type
            <kbd className="px-1.5 py-0.5 rounded"
              style={{ background: "rgba(99,91,255,0.1)", color: "#635BFF", border: "1px solid rgba(99,91,255,0.2)" }}>
              /
            </kbd>
            for AI
          </motion.span>
        )}
      </AnimatePresence>

      {/* Clear / ESC */}
      {value ? (
        <button onClick={() => onChange("")}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
          style={{ background: "rgba(255,255,255,0.06)", color: "#6B7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#E5E7EB"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#6B7280"; }}>
          <X size={11} />
        </button>
      ) : (
        <kbd className="px-2 py-1 rounded-lg text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.08)" }}>
          ESC
        </kbd>
      )}
    </div>
  </div>
));
SmartInput.displayName = "SmartInput";

// ─────────────────────────────────────────────────────────
// AI MODE PANEL — shown when query starts with "/"
// ─────────────────────────────────────────────────────────

const AiModePanel = ({ query, selected, onSelect, onHover }) => {
  // Filter suggestions by slash command if typed (e.g. "/plan")
  const q = query.toLowerCase();
  const filtered = q === "/"
    ? AI_SUGGESTIONS
    : AI_SUGGESTIONS.filter((s) =>
        s.id.includes(q.slice(1)) ||
        s.label.toLowerCase().includes(q.slice(1)) ||
        s.prompt.toLowerCase().includes(q.slice(1))
      );

  return (
    <motion.div
      key="ai-panel"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
    >
      {/* AI context banner */}
      <div className="mx-3 mt-3 mb-1 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5"
        style={{
          background: "linear-gradient(135deg,rgba(99,91,255,0.1) 0%,rgba(236,72,153,0.06) 100%)",
          border: "1px solid rgba(99,91,255,0.2)",
        }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#635BFF,#EC4899)", boxShadow: "0 0 10px rgba(99,91,255,0.4)" }}>
          <Sparkles size={11} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "#A78BFA" }}>Skillora AI</p>
          <p className="text-[10px]" style={{ color: "#4B5563" }}>
            Using your project &amp; task data · Powered by Gemini 1.5 Pro
          </p>
        </div>
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
          Online
        </span>
      </div>

      <SectionLabel label="AI Suggestions" isAi />

      <div className="px-2 pb-2 space-y-0.5">
        {filtered.length > 0 ? filtered.map((item, i) => (
          <ResultItem
            key={item.id}
            item={item}
            isActive={selected === i}
            index={i}
            onSelect={onSelect}
            onHover={onHover}
          />
        )) : (
          <div className="flex items-center gap-3 px-3 py-3">
            <Sparkles size={14} style={{ color: "#635BFF" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Press <kbd className="font-mono text-xs" style={{ color: "#A78BFA" }}>Enter</kbd> to ask AI: &ldquo;{query.slice(1)}&rdquo;
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// NORMAL MODE RESULTS
// ─────────────────────────────────────────────────────────

const NormalResults = ({ items, selected, onSelect, onHover, getSelectableIndex }) => (
  <motion.div
    key="normal-panel"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.12 }}
    className="px-2 pb-2"
  >
    {items.map((item, i) => {
      if (item._section) return <SectionLabel key={`sec-${i}`} label={item._section} />;
      if (item._empty)   return (
        <div key="empty" className="flex flex-col items-center justify-center py-10 gap-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Search size={16} style={{ color: "#374151" }} />
          </div>
          <p className="text-sm" style={{ color: "#4B5563" }}>{item.label}</p>
          <p className="text-xs" style={{ color: "#1F2937" }}>
            Try <span style={{ color: "#635BFF" }}>/</span> for AI commands
          </p>
        </div>
      );

      const selIdx   = getSelectableIndex(item);
      const isActive = selIdx === selected;
      return (
        <div key={item.id || i} data-active={isActive}>
          <ResultItem
            item={item._isRecent ? { ...item, icon: Clock } : item}
            isActive={isActive}
            index={selIdx}
            onSelect={onSelect}
            onHover={onHover}
          />
        </div>
      );
    })}
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────

const Footer = ({ isAiMode }) => (
  <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap"
    style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.25)" }}>
    {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([k, l]) => (
      <span key={l} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#374151" }}>
        <kbd className="px-1.5 py-0.5 rounded font-mono"
          style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.07)" }}>
          {k}
        </kbd>
        {l}
      </span>
    ))}
    {!isAiMode && (
      <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "#374151" }}>
        <kbd className="px-1.5 py-0.5 rounded font-mono"
          style={{ background: "rgba(99,91,255,0.1)", color: "#635BFF", border: "1px solid rgba(99,91,255,0.2)" }}>
          /
        </kbd>
        AI mode
      </span>
    )}
    <span className="ml-auto flex items-center gap-1.5 text-[10px]" style={{ color: "#374151" }}>
      <Sparkles size={9} style={{ color: isAiMode ? "#EC4899" : "#635BFF" }} />
      Skillora AI
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────

const CommandPalette = ({ isOpen, onClose }) => {
  const [query,      setQuery]      = useState("");
  const [selected,   setSelected]   = useState(0);
  const [apiResults, setApiResults] = useState({ projects: [], tasks: [], clients: [] });
  const [loading,    setLoading]    = useState(false);
  const [recent,     setRecent]     = useState([]);

  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const listRef  = useRef(null);

  const navigate      = useNavigate();
  const { logout }    = useAuthStore();
  const { sendMessage } = useAiStore();

  const debounced = useDebounce(query, 180);
  const isAiMode  = query.startsWith("/");

  // ── Open/close side-effects ──
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(0);
      setApiResults({ projects: [], tasks: [], clients: [] });
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // ── Click outside ──
  useClickOutside(panelRef, onClose, { enabled: isOpen, escKey: false });

  // ── Live API search (normal mode only) ──
  useEffect(() => {
    if (!debounced.trim() || debounced.startsWith("/")) {
      setApiResults({ projects: [], tasks: [], clients: [] });
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          api.get("/projects", { params: { search: debounced, limit: 4 } }),
          api.get("/clients",  { params: { search: debounced, limit: 4 } }),
        ]);
        if (!cancelled) setApiResults({
          projects: pRes.data.data.data || [],
          tasks:    [],
          clients:  cRes.data.data.data || [],
        });
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    run();
    return () => { cancelled = true; };
  }, [debounced]);

  // ── Build flat items list (normal mode) ──
  const normalItems = useMemo(() => {
    const list = [];
    if (!query.trim()) {
      if (recent.length > 0) {
        list.push({ _section: "Recent" });
        recent.forEach((r) => list.push({ ...r, _isRecent: true }));
      }
      list.push({ _section: "Quick Actions" });
      QUICK_ACTIONS.forEach((a) => list.push(a));
      return list;
    }
    const q = query.toLowerCase();
    const filteredActions = QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
    if (filteredActions.length > 0) {
      list.push({ _section: "Commands" });
      filteredActions.forEach((a) => list.push(a));
    }
    if (apiResults.projects.length > 0) {
      list.push({ _section: "Projects" });
      apiResults.projects.forEach((p) => list.push({
        id: `proj-${p._id}`, icon: FolderKanban, label: p.title || p.name,
        sub: p.status, typeBadge: "Project", color: "#635BFF", path: `/projects/${p._id}`,
      }));
    }
    if (apiResults.clients.length > 0) {
      list.push({ _section: "Clients" });
      apiResults.clients.forEach((c) => list.push({
        id: `client-${c._id}`, icon: Users, label: c.name,
        sub: c.email, typeBadge: "Client", color: "#F59E0B", path: `/clients/${c._id}`,
      }));
    }
    if (list.length === 0) list.push({ _empty: true, label: `No results for "${query}"` });
    return list;
  }, [query, apiResults, recent]);

  const selectableNormal = useMemo(() => normalItems.filter((i) => !i._section && !i._empty), [normalItems]);

  // AI mode selectable items
  const aiFiltered = useMemo(() => {
    const q = query.toLowerCase();
    return q === "/"
      ? AI_SUGGESTIONS
      : AI_SUGGESTIONS.filter((s) =>
          s.id.includes(q.slice(1)) || s.label.toLowerCase().includes(q.slice(1))
        );
  }, [query]);

  const selectableItems = isAiMode ? aiFiltered : selectableNormal;

  // ── Execute item (defined first so handleKey can reference it) ──
  const executeItem = useCallback((item) => {
    if (!item) return;
    onClose();

    if (item.prompt) {
      navigate("/ai", { state: { prompt: item.prompt } });
      return;
    }
    if (item.path) {
      if (item.id && !item._isRecent) {
        saveRecent({ id: item.id, label: item.label, typeBadge: item.typeBadge || "Page", color: item.color, path: item.path });
      }
      navigate(item.path);
      return;
    }
    if (item.action === "logout") { logout().then(() => navigate("/login")); }
  }, [navigate, onClose, logout]);

  // ── Keyboard navigation ──
  const handleKey = useCallback((e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, selectableItems.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && selectableItems[selected]) { e.preventDefault(); executeItem(selectableItems[selected]); return; }
    // AI mode: Enter with free-form text sends raw query
    if (e.key === "Enter" && isAiMode && selectableItems.length === 0 && query.length > 1) {
      e.preventDefault();
      const rawPrompt = query.slice(1).trim();
      if (rawPrompt) { onClose(); navigate("/ai", { state: { prompt: rawPrompt } }); }
    }
  }, [selected, selectableItems, isAiMode, query, onClose, executeItem, navigate]);

  // ── Scroll active into view ──
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const getSelectableIndex = (item) => selectableNormal.findIndex((s) => s === item);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
            style={{ background: "rgba(4,8,18,0.85)", backdropFilter: "blur(14px)" }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -14 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[640px] rounded-2xl overflow-hidden z-10"
            style={{
              background: "linear-gradient(160deg,rgba(13,20,40,0.99) 0%,rgba(8,14,28,0.99) 100%)",
              border:     isAiMode ? "1px solid rgba(99,91,255,0.3)" : "1px solid rgba(255,255,255,0.09)",
              boxShadow:  isAiMode
                ? "0 0 0 1px rgba(99,91,255,0.2), 0 40px 80px rgba(0,0,0,0.75), 0 0 120px rgba(99,91,255,0.15)"
                : "0 0 0 1px rgba(99,91,255,0.12), 0 40px 80px rgba(0,0,0,0.75), 0 0 100px rgba(99,91,255,0.07)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            {/* Top shimmer — changes color in AI mode */}
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
              style={{
                background: isAiMode
                  ? "linear-gradient(90deg,transparent,rgba(99,91,255,0.9),rgba(236,72,153,0.6),transparent)"
                  : "linear-gradient(90deg,transparent,rgba(99,91,255,0.75),rgba(0,212,255,0.5),transparent)",
                transition: "background 0.25s",
              }} />

            {/* Smart input */}
            <SmartInput
              ref={inputRef}
              value={query}
              onChange={(v) => { setQuery(v); setSelected(0); }}
              onKeyDown={handleKey}
              loading={loading}
              isAiMode={isAiMode}
            />

            {/* Results area */}
            <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: "420px", scrollbarWidth: "none" }}>
              <AnimatePresence mode="wait">
                {isAiMode ? (
                  <AiModePanel
                    key="ai"
                    query={query}
                    selected={selected}
                    onSelect={executeItem}
                    onHover={setSelected}
                  />
                ) : (
                  <NormalResults
                    key="normal"
                    items={normalItems}
                    selected={selected}
                    onSelect={executeItem}
                    onHover={setSelected}
                    getSelectableIndex={getSelectableIndex}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <Footer isAiMode={isAiMode} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
