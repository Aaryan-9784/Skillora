import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, TrendingUp, Settings,
  Zap, Shield, LogOut, ChevronRight, Bell,
  ChevronDown, User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";
import useSocket from "../hooks/useSocket";
import useSyncEvents from "../hooks/useSyncEvents";
import useAdminStore from "../store/adminStore";
import useNotificationStore from "../store/notificationStore";
import FloatingAiButton from "../components/ai/FloatingAiButton";
import NotificationsPanel from "../components/dashboard/NotificationsPanel";
import CommandPalette from "../components/ui/CommandPalette";
import GlobalSearch from "../components/ui/GlobalSearch";

const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "A";

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { to: "/admin",          icon: LayoutDashboard, label: "Overview", end: true },
      { to: "/admin/users",    icon: Users,           label: "Users"              },
      { to: "/admin/revenue",  icon: TrendingUp,      label: "Revenue"            },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { to: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

// ─── Tooltip ───────────────────────────────────────────────────────────────
const Tooltip = ({ label, show, children }) => (
  <div className="relative group/tip w-full">
    {children}
    {show && (
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[99]
                      px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150"
        style={{ background: "rgba(15,23,42,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(15,23,42,0.97)]" />
      </div>
    )}
  </div>
);

// ─── Section Label ─────────────────────────────────────────────────────────
const SectionLabel = ({ label, collapsed, first }) => (
  <AnimatePresence>
    {!collapsed ? (
      <motion.div key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`flex items-center gap-2.5 px-3 ${first ? "pt-4 pb-2" : "pt-6 pb-2"}`}>
        {!first && <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }} />}
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: "rgba(99,91,255,0.45)" }}>{label}</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }} />
      </motion.div>
    ) : (
      <motion.div key="dot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`${first ? "pt-3" : "pt-5"} pb-1 flex justify-center`}>
        <div className="w-1 h-1 rounded-full" style={{ background: "rgba(99,91,255,0.3)" }} />
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Nav Item ──────────────────────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, end, collapsed }) => (
  <Tooltip label={label} show={collapsed}>
    <NavLink to={to} end={end} className="block">
      {({ isActive }) => (
        <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}
          className={`relative flex items-center w-full select-none cursor-pointer rounded-xl overflow-hidden
            ${collapsed ? "justify-center px-0 py-[13px]" : "gap-3 px-3 py-[10px]"}`}
          style={{
            background: isActive ? "linear-gradient(135deg,rgba(99,91,255,0.18) 0%,rgba(139,92,246,0.08) 100%)" : "transparent",
            transition: "background 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,0.06)"; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; } }}
        >
          {isActive && (
            <motion.span layoutId="admin-nav-pill"
              className="absolute left-0 inset-y-[7px] w-[3px] rounded-r-full"
              style={{ background: "linear-gradient(180deg,#8B5CF6,#635BFF)", boxShadow: "0 0 12px rgba(99,91,255,0.9)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }} />
          )}
          {isActive && (
            <span className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 10% 50%,rgba(99,91,255,0.15) 0%,transparent 70%)" }} />
          )}
          <span className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
            style={{ background: isActive ? "rgba(99,91,255,0.2)" : "transparent", boxShadow: isActive ? "0 0 14px rgba(99,91,255,0.35),inset 0 1px 0 rgba(255,255,255,0.1)" : "none" }}>
            <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8}
              style={{ color: isActive ? "#A78BFA" : "#6B7280", filter: isActive ? "drop-shadow(0 0 6px rgba(167,139,250,0.8))" : "none", transition: "color 0.18s,filter 0.18s" }} />
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}
                className="flex-1 text-[13px] font-semibold whitespace-nowrap truncate"
                style={{ color: isActive ? "#EDE9FE" : "#6B7280", letterSpacing: isActive ? "-0.01em" : "0", transition: "color 0.18s" }}>
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </NavLink>
  </Tooltip>
);

// ─── User Card ─────────────────────────────────────────────────────────────
const UserCard = ({ user, collapsed, onToggle, onLogout, navigate }) => (
  <div className="space-y-1">
    <AnimatePresence>
      {!collapsed ? (
        <motion.div key="expanded" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(145deg,rgba(99,91,255,0.07) 0%,rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(99,91,255,0.18)", boxShadow: "0 0 0 1px rgba(99,91,255,0.06),inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => navigate("/admin/profile")}
            className="w-full flex items-center gap-3 px-3 py-3 transition-all duration-200 group"
            style={{ background: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#635BFF 0%,#A78BFA 100%)", boxShadow: "0 0 18px rgba(99,91,255,0.55),inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                {getInitials(user?.name)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate leading-tight" style={{ color: "#F9FAFB" }}>{user?.name}</p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(100,116,139,0.7)" }}>{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  <Shield size={8} strokeWidth={2.5} /> Admin
                </span>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: "rgba(167,139,250,0.4)", flexShrink: 0, transition: "color 0.2s" }}
              className="group-hover:!text-[#A78BFA]" />
          </button>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all duration-200"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#F87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}>
              <LogOut size={13} strokeWidth={2} /> Sign out
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-0.5">
          <Tooltip label={user?.name || "Admin"} show>
            <div className="flex justify-center py-1">
              <div className="relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.4)" }}>
                {getInitials(user?.name)}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                  style={{ background: "#22C55E", borderColor: "#0A1120" }} />
              </div>
            </div>
          </Tooltip>
          <Tooltip label="Sign out" show>
            <button onClick={onLogout}
              className="flex justify-center w-full py-1.5 transition-colors duration-150"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>
              <LogOut size={14} strokeWidth={1.8} />
            </button>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Collapse toggle */}
    <Tooltip label={collapsed ? "Expand sidebar" : ""} show={collapsed}>
      <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }} onClick={onToggle}
        className={`flex items-center w-full rounded-xl transition-colors duration-200 select-none hover:bg-white/5
          ${collapsed ? "justify-center px-0 py-[11px]" : "gap-2 px-3 py-2"}`}>
        <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.28, ease: [0.16,1,0.3,1] }} className="shrink-0">
          <ChevronRight size={15} strokeWidth={1.8} style={{ color: "#4B5563" }} />
        </motion.span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs font-medium whitespace-nowrap" style={{ color: "#6B7280" }}>
              Collapse
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </Tooltip>
  </div>
);

// ─── Admin Navbar ──────────────────────────────────────────────────────────
const AdminNavbar = ({ onSearch }) => {
  const { user, logout }                  = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchUnreadCount(); }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center h-14 px-5 gap-3"
        style={{
          background: "linear-gradient(90deg,rgba(9,15,28,0.94) 0%,rgba(11,18,32,0.94) 100%)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03),0 4px 24px rgba(0,0,0,0.35)",
        }}>
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.35),rgba(0,212,255,0.2),transparent)" }} />

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {/* Notifications */}
          <div className="relative">
            <motion.button whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.94 }}
              onClick={() => setNotifOpen(o => !o)}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{ color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#E5E7EB"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 8px rgba(99,91,255,0.6)" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.button>
            <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          <div className="w-px h-5 mx-0.5" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* User profile */}
          <div className="relative">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl transition-all duration-150"
              style={{ border: "1px solid transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.border = "1px solid transparent"; }}>
              <div className="relative w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
                {getInitials(user?.name)}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0A1120]"
                  style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: "#F9FAFB" }}>{user?.name?.split(" ")[0]}</p>
                <p className="text-[10px] leading-none" style={{ color: "#A78BFA" }}>Admin</p>
              </div>
              <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} style={{ color: "#6B7280" }} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }} transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
                    className="absolute right-0 top-11 z-20 w-60 rounded-2xl overflow-hidden"
                    style={{ background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 0 0 1px rgba(99,91,255,0.1),0 24px 56px rgba(0,0,0,0.7)", backdropFilter: "blur(24px)" }}>
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />
                    <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 20px rgba(99,91,255,0.45)" }}>
                            {getInitials(user?.name)}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                            style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 8px rgba(34,197,94,0.7)" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F9FAFB" }}>{user?.name}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: "#4B5563" }}>{user?.email}</p>
                          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit"
                            style={{ background: "rgba(99,91,255,0.14)", border: "1px solid rgba(99,91,255,0.25)" }}>
                            <Shield size={9} style={{ color: "#635BFF" }} />
                            <span className="text-[10px] font-bold tracking-wide" style={{ color: "#A78BFA" }}>Admin</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="py-2 px-2">
                      <motion.button whileHover={{ x: 2 }}
                        onClick={() => { navigate("/admin/profile"); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                        style={{ color: "#9CA3AF" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#F9FAFB"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <User size={13} />
                        </div>
                        <span className="font-medium">Profile</span>
                      </motion.button>
                    </div>
                    <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <motion.button whileHover={{ x: 2 }} onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mt-1"
                        style={{ color: "#EF4444" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <LogOut size={13} style={{ color: "#EF4444" }} />
                        </div>
                        <span className="font-medium">Sign out</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
};

// ─── Main Layout ───────────────────────────────────────────────────────────
const AdminLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate         = useNavigate();
  const [collapsed, setCollapsed]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useSocket();
  useSyncEvents();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fetchStats = useAdminStore(s => s.fetchStats);
  useEffect(() => {
    const h = () => fetchStats();
    window.addEventListener("admin:stats_refresh", h);
    return () => window.removeEventListener("admin:stats_refresh", h);
  }, [fetchStats]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080E1A" }}>

      {/* ══ SIDEBAR ══ */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 244 }}
        transition={{ duration: 0.28, ease: [0.16,1,0.3,1] }}
        className="relative flex flex-col h-screen shrink-0 overflow-hidden"
        style={{
          background: `${NOISE}, linear-gradient(180deg,#0B1220 0%,#080E1A 55%,#060A14 100%)`,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
        }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(99,91,255,0.07) 0%,transparent 70%)" }} />
          <div className="absolute bottom-16 -right-16 w-56 h-56 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(0,212,255,0.04) 0%,transparent 70%)" }} />
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
          style={{ background: "linear-gradient(180deg,transparent 0%,rgba(99,91,255,0.5) 35%,rgba(0,212,255,0.35) 65%,transparent 100%)" }} />

        {/* Logo */}
        <div className={`flex items-center h-[72px] shrink-0 relative ${collapsed ? "justify-center px-0" : "px-4"}`}>
          <div className="absolute bottom-0 inset-x-3 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.25),transparent)" }} />
          <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} transition={{ duration: 0.18 }}
            className="relative shrink-0 cursor-pointer" onClick={() => navigate("/admin")}>
            <motion.div className="absolute inset-0 rounded-xl"
              animate={{ opacity: [0.35,0.7,0.35] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", filter: "blur(12px)", transform: "scale(1.3)" }} />
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(145deg,#7C6FFF 0%,#5B52F0 100%)", boxShadow: "0 0 0 1px rgba(255,255,255,0.12),0 4px 16px rgba(99,91,255,0.5),inset 0 1px 0 rgba(255,255,255,0.22)" }}>
              <Zap size={18} className="text-white" strokeWidth={2.8} />
            </div>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
                className="ml-3 overflow-hidden select-none">
                <p className="text-[18px] font-black tracking-[-0.02em] whitespace-nowrap leading-none"
                  style={{ background: "linear-gradient(135deg,#FFFFFF 20%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Skillora
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: "linear-gradient(135deg,rgba(99,91,255,0.28) 0%,rgba(139,92,246,0.18) 100%)", border: "1px solid rgba(99,91,255,0.35)", color: "#C4B5FD" }}>
                    <Shield size={8} strokeWidth={2.5} /> Admin
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2" style={{ scrollbarWidth: "none" }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label}>
              <SectionLabel label={section.label} collapsed={collapsed} first={si === 0} />
              <div className="space-y-[2px]">
                {section.items.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="shrink-0 px-2 pb-3">
          <div className="mb-2 mx-1 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }} />
          <UserCard user={user} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onLogout={handleLogout} navigate={navigate} />
        </div>
      </motion.aside>

      {/* ══ MAIN ══ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0B1120 0%,#0D1526 100%)" }}>
        <AdminNavbar onSearch={() => setSearchOpen(true)} />
        <motion.main key="main" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
          className="flex-1 overflow-y-auto">
          <Outlet />
        </motion.main>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <FloatingAiButton />
    </div>
  );
};

export default AdminLayout;
