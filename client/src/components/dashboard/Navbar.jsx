import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, ChevronDown, LogOut,
  Settings, Command, Plus, Zap, FolderKanban,
  CheckSquare, Users, CreditCard, Sparkles, ArrowRight,
  Clock, FolderPlus, ListPlus, UserPlus, FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import NotificationsPanel from "./NotificationsPanel";
import { getInitials } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// COMMAND PALETTE DATA
// ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: FolderKanban, label: "Go to Projects",   shortcut: "P", path: "/projects", color: "#635BFF" },
  { icon: CheckSquare,  label: "Go to Tasks",       shortcut: "T", path: "/tasks",    color: "#22C55E" },
  { icon: Users,        label: "Go to Clients",     shortcut: "C", path: "/clients",  color: "#F59E0B" },
  { icon: CreditCard,   label: "Go to Payments",    shortcut: "M", path: "/payments", color: "#00D4FF" },
  { icon: Sparkles,     label: "Open AI Assistant", shortcut: "A", path: "/ai",       color: "#8B5CF6" },
];
const RECENT = [
  { label: "E-commerce Redesign", sub: "Project", path: "/projects" },
  { label: "API Integration task", sub: "Task",   path: "/tasks"    },
  { label: "Acme Corp",           sub: "Client",  path: "/clients"  },
];

// ─────────────────────────────────────────────────────────
// COMMAND PALETTE
// ─────────────────────────────────────────────────────────
const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen]);

  const filtered = query
    ? QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_ACTIONS;

  const go = (path) => { navigate(path); onClose(); };

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) go(filtered[selected].path);
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[13vh] px-4">
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
            style={{ background: "rgba(4,8,18,0.8)", backdropFilter: "blur(10px)" }}
            onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -14 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[580px] rounded-2xl overflow-hidden z-10"
            style={{
              background: "linear-gradient(160deg,rgba(13,20,40,0.99) 0%,rgba(8,14,28,0.99) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 0 0 1px rgba(99,91,255,0.18), 0 40px 80px rgba(0,0,0,0.7), 0 0 100px rgba(99,91,255,0.07)",
            }}
          >
            {/* Top shimmer */}
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.7),rgba(0,212,255,0.5),transparent)" }} />

            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Search size={16} style={{ color: "#635BFF", flexShrink: 0 }} />
              <input ref={inputRef} value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKey}
                placeholder="Search, commands, or jump to…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#F9FAFB", caretColor: "#635BFF" }} />
              <kbd className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.08)" }}>
                ESC
              </kbd>
            </div>

            {/* Recent */}
            {!query && (
              <div className="px-2 pt-3">
                <p className="px-3 pb-1.5 text-[9.5px] font-bold tracking-[0.12em] uppercase" style={{ color: "#374151" }}>
                  Recent
                </p>
                {RECENT.map((item, i) => (
                  <button key={i} onClick={() => go(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors duration-100"
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Clock size={12} style={{ color: "#374151", flexShrink: 0 }} />
                    <span className="text-sm flex-1" style={{ color: "#D1D5DB" }}>{item.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280" }}>{item.sub}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="px-2 pt-3 pb-2">
              <p className="px-3 pb-1.5 text-[9.5px] font-bold tracking-[0.12em] uppercase" style={{ color: "#374151" }}>
                {query ? "Results" : "Quick Actions"}
              </p>
              {filtered.length === 0
                ? <p className="text-center py-8 text-sm" style={{ color: "#374151" }}>No results for &quot;{query}&quot;</p>
                : filtered.map((a, i) => (
                  <motion.button key={a.label}
                    onClick={() => go(a.path)}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100"
                    style={{
                      background: i === selected ? "rgba(99,91,255,0.13)" : "transparent",
                      border: i === selected ? "1px solid rgba(99,91,255,0.22)" : "1px solid transparent",
                    }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${a.color}1A` }}>
                      <a.icon size={14} style={{ color: a.color }} />
                    </div>
                    <span className="text-sm flex-1" style={{ color: i === selected ? "#F9FAFB" : "#D1D5DB" }}>
                      {a.label}
                    </span>
                    {i === selected && <ArrowRight size={12} style={{ color: "#635BFF" }} />}
                    {!query && (
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {a.shortcut}
                      </kbd>
                    )}
                  </motion.button>
                ))
              }
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.25)" }}>
              {[["↑↓","navigate"],["↵","open"],["esc","close"]].map(([k,l]) => (
                <span key={l} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#374151" }}>
                  <kbd className="px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {k}
                  </kbd>{l}
                </span>
              ))}
              <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "#374151" }}>
                <Zap size={9} style={{ color: "#635BFF" }} /> Skillora AI
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────
// ICON BUTTON
// ─────────────────────────────────────────────────────────
const NavIconBtn = ({ onClick, children, badge, title }) => (
  <motion.button
    whileHover={{ scale: 1.06, y: -1 }}
    whileTap={{ scale: 0.94 }}
    onClick={onClick}
    title={title}
    className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
    style={{ color: "#6B7280" }}
    onMouseEnter={e => {
      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      e.currentTarget.style.color = "#E5E7EB";
      e.currentTarget.style.boxShadow = "0 0 14px rgba(99,91,255,0.18)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "#6B7280";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {children}
    {badge > 0 && (
      <span
        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full
                   flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 8px rgba(99,91,255,0.6)" }}
      >
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </motion.button>
);

// ─────────────────────────────────────────────────────────
// MAIN NAVBAR
// ─────────────────────────────────────────────────────────
const Navbar = ({ onCommandPalette }) => {
  const { user, logout }                  = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [cmdOpen, setCmdOpen]             = useState(false);
  const [createOpen, setCreateOpen]       = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchUnreadCount(); }, []);

  // Cmd+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const CREATE_ITEMS = [
    { icon: FolderPlus, label: "New Project", path: "/projects", color: "#635BFF" },
    { icon: ListPlus,   label: "New Task",    path: "/tasks",    color: "#22C55E" },
    { icon: UserPlus,   label: "New Client",  path: "/clients",  color: "#F59E0B" },
    { icon: FileText,   label: "New Invoice", path: "/payments/new", color: "#00D4FF" },
  ];

  const PROFILE_ITEMS = [
    { icon: Settings, label: "Settings", action: () => navigate("/settings") },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center h-14 px-5 gap-3"
        style={{
          background: "linear-gradient(90deg,rgba(9,15,28,0.94) 0%,rgba(11,18,32,0.94) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top shimmer line */}
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.35),rgba(0,212,255,0.2),transparent)" }} />

        {/* ── SEARCH BAR ── */}
        <motion.button
          onClick={() => setCmdOpen(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="hidden md:flex items-center gap-2.5 h-9 px-4 rounded-xl flex-1 max-w-[360px] text-left transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.border = "1px solid rgba(99,91,255,0.35)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(99,91,255,0.12)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Search size={13} style={{ color: "#635BFF", flexShrink: 0 }} />
          <span className="flex-1 text-xs" style={{ color: "#6B7280" }}>
            Search, commands, or jump to…
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            <kbd className="flex items-center justify-center w-5 h-5 rounded text-[10px]"
              style={{ background: "rgba(255,255,255,0.06)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Command size={9} />
            </kbd>
            <kbd className="flex items-center justify-center w-5 h-5 rounded text-[10px]"
              style={{ background: "rgba(255,255,255,0.06)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.08)" }}>
              K
            </kbd>
          </div>
        </motion.button>

        <div className="flex-1" />

        {/* ── RIGHT ACTIONS ── */}
        <div className="flex items-center gap-1">

          {/* + New button with dropdown */}
          <div className="relative mr-1">
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCreateOpen((o) => !o)}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold text-white transition-all duration-150"
              style={{
                background: "linear-gradient(135deg,#635BFF 0%,#8B5CF6 100%)",
                boxShadow: "0 0 16px rgba(99,91,255,0.35)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 24px rgba(99,91,255,0.55)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 16px rgba(99,91,255,0.35)"}
            >
              <Plus size={13} strokeWidth={2.5} />
              New
            </motion.button>

            {/* Create dropdown */}
            <AnimatePresence>
              {createOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCreateOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-10 z-20 w-48 rounded-2xl overflow-hidden py-1.5"
                    style={{
                      background: "rgba(10,16,30,0.98)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 0 0 1px rgba(99,91,255,0.12), 0 20px 40px rgba(0,0,0,0.6)",
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.5),transparent)" }} />
                    <p className="px-3.5 pt-1 pb-1.5 text-[9.5px] font-bold tracking-[0.12em] uppercase"
                      style={{ color: "#374151" }}>Create new</p>
                    {CREATE_ITEMS.map(({ icon: Icon, label, path, color }) => (
                      <button key={label}
                        onClick={() => { navigate(path); setCreateOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100"
                        style={{ color: "#9CA3AF" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#F9FAFB"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                      >
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${color}18` }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-0.5" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Notifications */}
          <div className="relative">
            <NavIconBtn onClick={() => setNotifOpen((o) => !o)} badge={unreadCount} title="Notifications">
              <Bell size={15} />
            </NavIconBtn>
            <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-0.5" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* User profile */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl transition-all duration-150"
              style={{ border: "1px solid transparent" }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.border = "1px solid transparent";
              }}
            >
              {/* Avatar */}
              <div className="relative w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
                {getInitials(user?.name)}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0A1120]"
                  style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: "#F9FAFB" }}>
                  {user?.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] leading-none capitalize" style={{ color: "#635BFF" }}>
                  {user?.plan || "free"}
                </p>
              </div>

              <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} style={{ color: "#6B7280" }} />
              </motion.div>
            </motion.button>

            {/* Profile dropdown */}
            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-11 z-20 w-56 rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 0 0 1px rgba(99,91,255,0.1), 0 24px 48px rgba(0,0,0,0.65)",
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.5),transparent)" }} />

                    {/* User info */}
                    <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
                          {getInitials(user?.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F9FAFB" }}>{user?.name}</p>
                          <p className="text-xs truncate" style={{ color: "#6B7280" }}>{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit"
                        style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
                        <Zap size={10} style={{ color: "#635BFF" }} />
                        <span className="text-[10px] font-semibold capitalize" style={{ color: "#A78BFA" }}>
                          {user?.plan || "free"} plan
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5 px-1.5">
                      {PROFILE_ITEMS.map(({ icon: Icon, label, action }) => (
                        <button key={label}
                          onClick={() => { action(); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-100"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#F9FAFB"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                        >
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "rgba(255,255,255,0.05)" }}>
                            <Icon size={13} />
                          </div>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="px-1.5 pb-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-100 mt-1"
                        style={{ color: "#EF4444" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(239,68,68,0.1)" }}>
                          <LogOut size={13} />
                        </div>
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
};

export default Navbar;
