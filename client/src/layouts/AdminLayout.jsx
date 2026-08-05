import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, TrendingUp, Settings,
  Zap, Shield, LogOut, ChevronRight, Bell,
  ChevronDown, User, Home,
} from "lucide-react";

const ADMIN_CONFIG = {
  "/admin":          { title: "Overview",          icon: LayoutDashboard },
  "/admin/users":    { title: "Users",             icon: Users },
  "/admin/profile":  { title: "Profile",           icon: User },
};
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
import useClickOutside from "../hooks/useClickOutside";

const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "A";

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { to: "/admin",          icon: LayoutDashboard, label: "Overview", end: true },
      { to: "/admin/users",    icon: Users,           label: "Users"              },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { to: "/admin/profile",  icon: User,            label: "Profile"            },
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
          exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all duration-200 cursor-pointer group/logout">
            <LogOut size={14} strokeWidth={2} className="group-hover/logout:-translate-x-0.5 transition-transform duration-200" />
            <span>Sign out</span>
          </button>
        </motion.div>
      ) : (
        <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-0.5">
          <Tooltip label={user?.name || "Admin"} show>
            <div className="flex justify-center py-1">
              <div className="relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                style={{ background: user?.avatar ? "transparent" : "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.4)" }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  getInitials(user?.name)
                )}
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
  const dropdownRef                       = useRef(null);
  const notifRef                          = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useClickOutside(dropdownRef, () => setDropdownOpen(false), { enabled: dropdownOpen });
  useClickOutside(notifRef, () => setNotifOpen(false), { enabled: notifOpen });

  useEffect(() => {
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);
  const currentConfig = ADMIN_CONFIG[location.pathname] || { title: "Overview", icon: LayoutDashboard };
  const PageIcon = currentConfig.icon;
  const pageTitle = currentConfig.title;

  useEffect(() => { fetchUnreadCount(); }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 gap-3"
        style={{
          background: "linear-gradient(90deg,rgba(9,15,28,0.94) 0%,rgba(11,18,32,0.94) 100%)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03),0 4px 24px rgba(0,0,0,0.35)",
        }}>
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.35),rgba(0,212,255,0.2),transparent)" }} />

        {/* ── BREADCRUMB NAVIGATION ── */}
        <div className="flex items-center gap-2.5 select-none text-xs">
          {/* Home Logo Button */}
          <motion.button
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate("/")}
            title="Go to Home"
            className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200"
            style={{
              background: "linear-gradient(145deg,#7C6FFF 0%,#5B52F0 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 4px 14px rgba(99,91,255,0.45)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.18), 0 4px 20px rgba(99,91,255,0.7)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.12), 0 4px 14px rgba(99,91,255,0.45)";
            }}
          >
            <Home size={15} className="text-white" />
          </motion.button>

          <span className="text-gray-500/40 font-bold text-sm select-none">/</span>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shrink-0"
            style={{
              background: "rgba(139,92,246,0.12)",
              borderColor: "rgba(139,92,246,0.25)",
              color: "#C4B5FD",
            }}>
            <span>Admin Panel</span>
          </div>

          <span className="text-gray-500 font-bold text-sm select-none">/</span>

          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
            {PageIcon && <PageIcon size={14} className="text-purple-400 shrink-0" />}
            <span>{pageTitle}</span>
          </div>
        </div>

        {/* ── RIGHT ACTIONS ── */}
        <div className="flex items-center gap-3.5">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.94 }}
              onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={{ color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#E5E7EB"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 8px rgba(99,91,255,0.6)" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.button>
            <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.12)" }} />

          {/* User profile */}
          <div className="relative" ref={dropdownRef}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false); }}
              className="flex items-center gap-2.5 px-1 py-1 rounded-xl transition-all duration-150 group cursor-pointer">
              <div className="relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: user?.avatar ? "transparent" : "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  getInitials(user?.name)
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A1120]"
                  style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
              </div>
              <div className="hidden sm:flex flex-col justify-center text-left py-0.5">
                <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors leading-tight">{user?.name}</p>
                <p className="text-[10px] font-medium text-purple-400 capitalize leading-tight mt-0.5">Admin</p>
              </div>
              <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-0.5">
                <ChevronDown size={13} className="text-gray-400 group-hover:text-white transition-colors" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }} transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
                    className="absolute right-0 top-11 z-20 w-60 rounded-2xl overflow-hidden"
                    style={{ background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 0 0 1px rgba(99,91,255,0.1),0 24px 56px rgba(0,0,0,0.7)", backdropFilter: "blur(24px)" }}>
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />
                    <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white overflow-hidden"
                            style={{ background: user?.avatar ? "transparent" : "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 20px rgba(99,91,255,0.45)" }}>
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              getInitials(user?.name)
                            )}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                            style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 8px rgba(34,197,94,0.7)" }} />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center text-left py-0.5">
                          <p className="text-sm font-bold truncate text-white leading-tight">{user?.name}</p>
                          <p className="text-xs text-purple-400 font-medium capitalize leading-tight mt-0.5">Admin</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2 px-2 space-y-1">
                      <motion.button whileHover={{ x: 2 }}
                        onClick={() => { navigate("/"); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
                        style={{ color: "#9CA3AF" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#F9FAFB"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
                          <Home size={13} className="text-purple-400" />
                        </div>
                        <span className="font-medium">Home Page</span>
                      </motion.button>
                      <motion.button whileHover={{ x: 2 }}
                        onClick={() => { navigate("/admin/profile"); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
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
  const [cmdOpen, setCmdOpen]       = useState(false);
  useSocket();
  useSyncEvents();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(o => !o); }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") { e.preventDefault(); setCmdOpen(o => !o); }
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

        {/* Logo / Workspace Header */}
        <div className={`flex items-center h-16 pt-1.5 shrink-0 relative ${collapsed ? "justify-center px-0" : "px-4"}`}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/admin")}>
            <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} transition={{ duration: 0.18 }}
              className="relative shrink-0">
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(145deg,#7C6FFF 0%,#5B52F0 100%)", boxShadow: "0 0 0 1px rgba(255,255,255,0.12),0 4px 16px rgba(99,91,255,0.5)" }}>
                <Zap size={17} className="text-white fill-white" />
              </div>
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.2 }}
                  className="select-none flex flex-col justify-center text-left">
                  <p className="text-[17px] font-extrabold tracking-tight leading-none text-white">
                    Skillora
                  </p>
                  <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mt-1 text-purple-400">
                    ADMIN WORKSPACE
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      <FloatingAiButton />
    </div>
  );
};

export default AdminLayout;
