import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, FolderOpen, User,
  LogOut, Bell, ChevronRight, Zap, Menu, X,
  MessageSquare, CheckCircle2, Clock, AlertCircle,
  FolderKanban, CreditCard, Sparkles, Home,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useSocket from "../hooks/useSocket";
import useSyncEvents from "../hooks/useSyncEvents";
import useClientPortalStore from "../store/clientPortalStore";
import { getInitials, relativeTime } from "../utils/helpers";

const NAV = [
  { to: "/client/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/client/invoices", icon: FileText, label: "Invoices" },
  { to: "/client/projects", icon: FolderOpen, label: "Projects" },
  { to: "/client/messages", icon: MessageSquare, label: "Messages" },
  { to: "/client/profile", icon: User, label: "Profile" },
];

const CLIENT_CONFIG = {
  "/client/dashboard": { title: "Overview", icon: LayoutDashboard },
  "/client/invoices":  { title: "Invoices", icon: FileText },
  "/client/projects":  { title: "Projects", icon: FolderOpen },
  "/client/messages":  { title: "Messages", icon: MessageSquare },
  "/client/profile":   { title: "Profile",  icon: User },
};

// ── Notification type → icon + color ─────────────────────
const NOTIF_CONFIG = {
  invoice_sent: { icon: FileText, color: "#F59E0B" },
  invoice_paid: { icon: CreditCard, color: "#22C55E" },
  invoice_overdue: { icon: AlertCircle, color: "#EF4444" },
  payment_received: { icon: CreditCard, color: "#22C55E" },
  project_updated: { icon: FolderKanban, color: "#635BFF" },
  project_created: { icon: FolderKanban, color: "#635BFF" },
  task_assigned: { icon: CheckCircle2, color: "#A78BFA" },
  ai_suggestion: { icon: Sparkles, color: "#8B5CF6" },
  default: { icon: Bell, color: "#6B7280" },
};

// ── Notifications panel ───────────────────────────────────
const NotificationsPanel = ({ open, onClose }) => {
  const { notifications, unreadCount, loading, fetchNotifications, markNotificationRead, markAllNotificationsRead } = useClientPortalStore();

  useEffect(() => {
    if (open && notifications.length === 0) fetchNotifications();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-50 w-80 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,91,255,0.1)",
            }}>
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />

            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: "#A78BFA" }} />
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(99,91,255,0.25)", color: "#A78BFA" }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllNotificationsRead}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: "#635BFF" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
                  onMouseLeave={e => e.currentTarget.style.color = "#635BFF"}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 360, scrollbarWidth: "none" }}>
              {loading.notifications && notifications.length === 0 ? (
                <div className="space-y-1 p-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl animate-pulse"
                      style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Bell size={24} style={{ color: "#374151" }} />
                  <p className="text-xs" style={{ color: "#6B7280" }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.default;
                  const Icon = cfg.icon;
                  return (
                    <button key={n._id} onClick={() => markNotificationRead(n._id)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-100"
                      style={{ background: n.read ? "transparent" : "rgba(99,91,255,0.05)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(99,91,255,0.05)"}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}25` }}>
                        <Icon size={12} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white leading-snug">{n.title}</p>
                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "#6B7280" }}>{n.message}</p>
                        <p className="text-[10px] mt-1" style={{ color: "#4B5563" }}>{relativeTime(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{ background: "#635BFF", boxShadow: "0 0 6px rgba(99,91,255,0.7)" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Sidebar nav item ──────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, end, collapsed, onClick }) => (
  <NavLink to={to} end={end} onClick={onClick}>
    {({ isActive }) => (
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center rounded-xl select-none cursor-pointer transition-all duration-150
          ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"}`}
        style={{
          background: isActive
            ? "linear-gradient(135deg,rgba(99,91,255,0.18) 0%,rgba(139,92,246,0.08) 100%)"
            : "transparent",
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        {isActive && (
          <motion.span layoutId="client-nav-pill"
            className="absolute left-0 inset-y-[7px] w-[3px] rounded-r-full"
            style={{ background: "linear-gradient(180deg,#8B5CF6,#635BFF)", boxShadow: "0 0 12px rgba(99,91,255,0.9)" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          />
        )}
        <span className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
          style={{
            background: isActive ? "rgba(99,91,255,0.2)" : "transparent",
            boxShadow: isActive ? "0 0 14px rgba(99,91,255,0.35)" : "none",
          }}>
          <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8}
            style={{
              color: isActive ? "#A78BFA" : "#6B7280",
              filter: isActive ? "drop-shadow(0 0 6px rgba(167,139,250,0.8))" : "none",
            }}
          />
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              className="flex-1 text-[13px] font-semibold whitespace-nowrap"
              style={{ color: isActive ? "#EDE9FE" : "#6B7280" }}>
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    )}
  </NavLink>
);

// ── Main layout ───────────────────────────────────────────
const ClientLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { unreadCount, fetchUnreadCount } = useClientPortalStore();

  useSocket();
  useSyncEvents();

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => { fetchUnreadCount(); }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const currentConfig = CLIENT_CONFIG[location.pathname] || {
    title: NAV.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))?.label ?? "Overview",
    icon: NAV.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))?.icon ?? LayoutDashboard,
  };
  const PageIcon = currentConfig.icon;
  const pageTitle = currentConfig.title;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080E1A" }}>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`
          relative flex flex-col h-screen shrink-0 overflow-hidden z-50
          lg:relative lg:translate-x-0
          ${mobileOpen ? "fixed translate-x-0" : "fixed -translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "linear-gradient(180deg,#0B1220 0%,#080E1A 55%,#060A14 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
          width: collapsed ? 64 : 220,
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(99,91,255,0.07) 0%,transparent 70%)" }} />
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
          style={{ background: "linear-gradient(180deg,transparent 0%,rgba(99,91,255,0.5) 35%,rgba(0,212,255,0.35) 65%,transparent 100%)" }} />

        {/* Logo / Workspace Header */}
        <div className={`flex items-center h-16 pt-1.5 shrink-0 relative ${collapsed ? "justify-center px-0" : "px-4"}`}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/client/dashboard")}>
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
                  <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mt-1 text-cyan-400">
                    CLIENT WORKSPACE
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-3" style={{ scrollbarWidth: "none" }}>
          <div className="space-y-[2px]">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        </nav>

        {/* Bottom user profile & logout */}
        <div className="shrink-0 px-2 pb-3">
          <div className="mb-2 mx-1 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }} />
          <AnimatePresence>
            {!collapsed ? (
              <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden mb-1"
                style={{ background: "linear-gradient(145deg,rgba(99,91,255,0.07) 0%,rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(99,91,255,0.18)" }}>
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg,#635BFF,#A78BFA)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
                    {getInitials(user?.name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left flex flex-col justify-center gap-0.5">
                    <p className="text-sm font-bold truncate leading-tight text-white">{user?.name}</p>
                    <p className="text-xs font-semibold text-cyan-400 capitalize leading-tight truncate">Client</p>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all duration-200"
                    style={{ color: "#4B5563" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#F87171"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}>
                    <LogOut size={12} strokeWidth={2} /> Sign out
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)" }}>
                  {getInitials(user?.name)}
                </div>
                <button onClick={handleLogout} className="p-1.5 transition-colors duration-150"
                  style={{ color: "#4B5563" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                  onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>
                  <LogOut size={13} strokeWidth={1.8} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }} onClick={() => setCollapsed((c) => !c)}
            className={`flex items-center w-full rounded-xl transition-colors duration-200 hover:bg-white/5
              ${collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2"}`}>
            <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.28 }}>
              <ChevronRight size={14} strokeWidth={1.8} style={{ color: "#4B5563" }} />
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
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0B1120 0%,#0D1526 100%)" }}>

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-6 gap-3 shrink-0"
          style={{
            background: "linear-gradient(90deg,rgba(9,15,28,0.94) 0%,rgba(11,18,32,0.94) 100%)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.03),0 4px 24px rgba(0,0,0,0.35)",
          }}>
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.35),rgba(0,212,255,0.2),transparent)" }} />

          <button className="lg:hidden p-1.5 rounded-lg" style={{ color: "#6B7280" }}
            onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        {/* ── BREADCRUMB NAVIGATION ── */}
        <div className="flex items-center gap-2.5 select-none text-xs">
          <Link to="/" title="Home" className="group transition-transform hover:scale-105 active:scale-95 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #00D4FF 100%)",
                boxShadow: "0 0 16px rgba(59,130,246,0.45)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}>
              <Home size={15} className="text-white fill-white" />
            </div>
          </Link>

          <span className="text-gray-500 font-bold text-sm select-none">/</span>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shrink-0"
            style={{
              background: "rgba(0,212,255,0.12)",
              borderColor: "rgba(0,212,255,0.25)",
              color: "#22D3EE",
            }}>
            <span>Client Portal</span>
          </div>

          <span className="text-gray-500 font-bold text-sm hidden sm:inline select-none">/</span>

          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
            {PageIcon && <PageIcon size={14} className="text-cyan-400 shrink-0" />}
            <span>{pageTitle}</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* ── RIGHT ACTIONS ── */}
        <div className="flex items-center gap-3.5">
          {/* Notifications bell */}
          <div className="relative">
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={() => setNotifOpen((o) => !o)}
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

          {/* User chip */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#635BFF,#A78BFA)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:flex flex-col justify-center text-left py-0.5">
              <p className="text-xs font-bold text-white leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] font-medium text-cyan-400 capitalize leading-tight mt-0.5">
                Client
              </p>
            </div>
          </div>
        </div>
        </header>

        {/* Page content */}
        <motion.main key={location.pathname}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto">
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default ClientLayout;

