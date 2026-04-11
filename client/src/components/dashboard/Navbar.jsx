import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Sun, Moon, ChevronDown, LogOut,
  Settings, User, Command, Plus, Zap, FolderKanban,
  CheckSquare, Users, CreditCard, Sparkles, ArrowRight,
  Clock, Hash, CreditCard as BillingIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import useNotificationStore from "../../store/notificationStore";
import NotificationsPanel from "./NotificationsPanel";
import { getInitials } from "../../utils/helpers";

// ── Quick actions shown in command palette ────────────────
const QUICK_ACTIONS = [
  { icon: FolderKanban, label: "Go to Projects",   shortcut: "P", path: "/projects",  color: "#635BFF" },
  { icon: CheckSquare,  label: "Go to Tasks",       shortcut: "T", path: "/tasks",     color: "#10B981" },
  { icon: Users,        label: "Go to Clients",     shortcut: "C", path: "/clients",   color: "#F59E0B" },
  { icon: CreditCard,   label: "Go to Payments",    shortcut: "M", path: "/payments",  color: "#00D4FF" },
  { icon: Sparkles,     label: "Open AI Assistant", shortcut: "A", path: "/ai",        color: "#8B5CF6" },
];

const RECENT = [
  { icon: Clock, label: "E-commerce Redesign",  sub: "Project",  path: "/projects" },
  { icon: Clock, label: "API Integration task", sub: "Task",     path: "/tasks" },
  { icon: Clock, label: "Acme Corp",            sub: "Client",   path: "/clients" },
];

// ── Command Palette ───────────────────────────────────────
const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery]     = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef  = useRef(null);
  const navigate  = useNavigate();

  useEffect(() => {
    if (isOpen) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [isOpen]);

  const filtered = query
    ? QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_ACTIONS;

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) { navigate(filtered[selected].path); onClose(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
            style={{ background: "rgba(5,10,20,0.75)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[560px] rounded-2xl overflow-hidden z-10"
            style={{
              background: "linear-gradient(145deg, rgba(15,23,42,0.98) 0%, rgba(10,17,32,0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 0 0 1px rgba(99,91,255,0.15), 0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(99,91,255,0.08)",
            }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.6), rgba(0,212,255,0.4), transparent)" }} />

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Search size={16} style={{ color: "#635BFF", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKey}
                placeholder="Search, commands, or jump to…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#F9FAFB", caretColor: "#635BFF" }}
              />
              <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.08)" }}>
                ESC
              </kbd>
            </div>

            {/* Recent (when no query) */}
            {!query && (
              <div className="px-2 pt-2">
                <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: "#4B5563" }}>Recent</p>
                {RECENT.map((item, i) => (
                  <button key={i} onClick={() => { navigate(item.path); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150"
                    style={{ color: "#9CA3AF" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Clock size={13} style={{ color: "#4B5563", flexShrink: 0 }} />
                    <span className="text-sm flex-1" style={{ color: "#D1D5DB" }}>{item.label}</span>
                    <span className="text-xs" style={{ color: "#4B5563" }}>{item.sub}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick actions / filtered results */}
            <div className="px-2 pt-2 pb-2">
              <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "#4B5563" }}>{query ? "Results" : "Quick Actions"}</p>
              {filtered.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: "#4B5563" }}>No results for &quot;{query}&quot;</p>
              ) : (
                filtered.map((action, i) => (
                  <motion.button
                    key={action.label}
                    onClick={() => { navigate(action.path); onClose(); }}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100"
                    style={{
                      background: i === selected ? "rgba(99,91,255,0.12)" : "transparent",
                      border: i === selected ? "1px solid rgba(99,91,255,0.2)" : "1px solid transparent",
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${action.color}18` }}>
                      <action.icon size={14} style={{ color: action.color }} />
                    </div>
                    <span className="text-sm flex-1" style={{ color: i === selected ? "#F9FAFB" : "#D1D5DB" }}>
                      {action.label}
                    </span>
                    {i === selected && (
                      <div className="flex items-center gap-1.5">
                        <ArrowRight size={12} style={{ color: "#635BFF" }} />
                      </div>
                    )}
                    {!query && (
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {action.shortcut}
                      </kbd>
                    )}
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
              {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([key, label]) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#4B5563" }}>
                  <kbd className="px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {key}
                  </kbd>
                  {label}
                </span>
              ))}
              <span className="ml-auto flex items-center gap-1.5 text-[10px]" style={{ color: "#4B5563" }}>
                <Zap size={10} style={{ color: "#635BFF" }} /> Skillora AI
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── Icon button ───────────────────────────────────────────
const NavIconBtn = ({ onClick, children, badge, title }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
    style={{ color: "#6B7280" }}
    onMouseEnter={e => {
      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      e.currentTarget.style.color = "#E5E7EB";
      e.currentTarget.style.boxShadow = "0 0 12px rgba(99,91,255,0.15)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "#6B7280";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {children}
    {badge > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full
                       flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: "#635BFF", boxShadow: "0 0 8px rgba(99,91,255,0.6)" }}>
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </motion.button>
);

// ── Main Navbar ───────────────────────────────────────────
const Navbar = ({ onCommandPalette }) => {
  const { user, logout }                    = useAuthStore();
  const { isDark, toggle }                  = useThemeStore();
  const { unreadCount, fetchUnreadCount }   = useNotificationStore();
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);
  const [cmdOpen, setCmdOpen]               = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchUnreadCount(); }, []);

  // Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const DROPDOWN_ITEMS = [
    { icon: User,        label: "Profile",  action: () => navigate("/settings?tab=profile") },
    { icon: Settings,    label: "Settings", action: () => navigate("/settings") },
    { icon: BillingIcon, label: "Billing",  action: () => navigate("/settings?tab=billing") },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center h-14 px-5 gap-3"
        style={{
          background: "linear-gradient(90deg, rgba(10,37,64,0.92) 0%, rgba(15,23,42,0.92) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99,91,255,0.3) 30%, rgba(0,212,255,0.2) 70%, transparent 100%)" }} />

        {/* ── Command search bar ──────────────────────── */}
        <motion.button
          onClick={() => setCmdOpen(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="hidden md:flex items-center gap-2.5 h-9 px-3.5 rounded-xl flex-1 max-w-[340px]
                     text-left transition-all duration-200 group"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.border = "1px solid rgba(99,91,255,0.3)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(99,91,255,0.1)";
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
            <kbd className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Command size={9} />
            </kbd>
            <kbd className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.08)" }}>
              K
            </kbd>
          </div>
        </motion.button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Right actions ───────────────────────────── */}
        <div className="flex items-center gap-1">

          {/* Create button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/projects")}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium
                       transition-all duration-150 mr-1"
            style={{
              background: "linear-gradient(135deg, rgba(99,91,255,0.2) 0%, rgba(99,91,255,0.1) 100%)",
              border: "1px solid rgba(99,91,255,0.3)",
              color: "#A78BFA",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,91,255,0.3) 0%, rgba(99,91,255,0.15) 100%)";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(99,91,255,0.25)";
              e.currentTarget.style.color = "#C4B5FD";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,91,255,0.2) 0%, rgba(99,91,255,0.1) 100%)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.color = "#A78BFA";
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            New
          </motion.button>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Theme toggle */}
          <NavIconBtn onClick={toggle} title="Toggle theme">
            <AnimatePresence mode="wait">
              <motion.div key={isDark ? "sun" : "moon"}
                initial={{ rotate: -20, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 20, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </motion.div>
            </AnimatePresence>
          </NavIconBtn>

          {/* Notifications */}
          <div className="relative">
            <NavIconBtn onClick={() => setNotifOpen((o) => !o)} badge={unreadCount} title="Notifications">
              <Bell size={15} />
            </NavIconBtn>
            <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />

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
                style={{
                  background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)",
                  boxShadow: "0 0 12px rgba(99,91,255,0.4)",
                }}>
                {getInitials(user?.name)}
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0A1120]"
                  style={{ background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }} />
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: "#F9FAFB" }}>
                  {user?.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] leading-none capitalize" style={{ color: "#635BFF" }}>
                  {user?.plan || "free"}
                </p>
              </div>

              <motion.div
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={12} style={{ color: "#6B7280" }} />
              </motion.div>
            </motion.button>

            {/* Dropdown */}
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
                      background: "linear-gradient(145deg, rgba(13,21,38,0.98) 0%, rgba(10,17,32,0.98) 100%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 0 0 1px rgba(99,91,255,0.1), 0 24px 48px rgba(0,0,0,0.6)",
                    }}
                  >
                    {/* Top glow */}
                    <div className="absolute top-0 left-0 right-0 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.5), transparent)" }} />

                    {/* User info */}
                    <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, #635BFF, #8579FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
                          {getInitials(user?.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F9FAFB" }}>{user?.name}</p>
                          <p className="text-xs truncate" style={{ color: "#6B7280" }}>{user?.email}</p>
                        </div>
                      </div>
                      {/* Plan badge */}
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
                      {DROPDOWN_ITEMS.map(({ icon: Icon, label, action }) => (
                        <button key={label}
                          onClick={() => { action(); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm
                                     transition-all duration-100 group"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            e.currentTarget.style.color = "#F9FAFB";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#9CA3AF";
                          }}
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
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm
                                   transition-all duration-100 mt-1"
                        style={{ color: "#EF4444" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                          e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(239,68,68,0.15)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.boxShadow = "none";
                        }}
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

      {/* Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
};

export default Navbar;
