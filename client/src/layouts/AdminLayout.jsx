import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, TrendingUp, Settings,
  Zap, Shield, LogOut, ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";
import useSocket from "../hooks/useSocket";
import useSyncEvents from "../hooks/useSyncEvents";
import useAdminStore from "../store/adminStore";

const NAV = [
  { to: "/admin",          icon: LayoutDashboard, label: "Overview",  end: true },
  { to: "/admin/users",    icon: Users,           label: "Users"               },
  { to: "/admin/revenue",  icon: TrendingUp,      label: "Revenue"             },
  { to: "/admin/settings", icon: Settings,        label: "Settings"            },
];

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

// ─── Tooltip ───────────────────────────────────────────────────────────────
const Tip = ({ label, show, children }) => (
  <div className="relative w-full">
    {children}
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -8, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.9 }}
          transition={{ duration: 0.15, ease: [0.16,1,0.3,1] }}
          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[200]
                     px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white whitespace-nowrap"
          style={{
            fontFamily: "'Inter',sans-serif",
            background: "linear-gradient(135deg,rgba(13,17,38,0.99),rgba(8,12,28,0.99))",
            border: "1px solid rgba(99,91,255,0.22)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6),0 0 0 1px rgba(99,91,255,0.08)",
          }}
        >
          {label}
          <span className="absolute right-full top-1/2 -translate-y-1/2
                           border-[5px] border-transparent border-r-[rgba(13,17,38,0.99)]" />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── Nav Item ──────────────────────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, end, collapsed, index }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Tip label={label} show={collapsed && hovered}>
      <NavLink to={to} end={end} className="block">
        {({ isActive }) => (
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 + index * 0.055, duration: 0.4, ease: [0.16,1,0.3,1] }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative flex items-center rounded-xl cursor-pointer select-none overflow-hidden"
            style={{
              gap: collapsed ? 0 : 11,
              padding: collapsed ? "10px 0" : "10px 13px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: isActive
                ? "linear-gradient(135deg,rgba(99,91,255,0.24) 0%,rgba(139,92,246,0.13) 100%)"
                : hovered ? "rgba(255,255,255,0.04)" : "transparent",
              border: isActive
                ? "1px solid rgba(99,91,255,0.26)"
                : hovered ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
              backdropFilter: isActive || hovered ? "blur(12px)" : "none",
              boxShadow: isActive
                ? "0 4px 28px rgba(99,91,255,0.18),inset 0 1px 0 rgba(255,255,255,0.07)"
                : hovered ? "0 2px 14px rgba(0,0,0,0.22)" : "none",
              transform: hovered && !isActive ? "translateX(3px)" : "none",
              transition: "all 0.22s ease",
            }}
          >
            {/* active left bar */}
            {isActive && (
              <motion.span
                layoutId="admin-pill"
                className="absolute left-0 inset-y-[7px] w-[3px] rounded-r-full"
                style={{
                  background: "linear-gradient(180deg,#C4B5FD 0%,#635BFF 100%)",
                  boxShadow: "0 0 12px rgba(99,91,255,1),0 0 24px rgba(99,91,255,0.45)",
                }}
                transition={{ type: "spring", stiffness: 450, damping: 34 }}
              />
            )}

            {/* active shimmer */}
            {isActive && (
              <span className="absolute inset-0 pointer-events-none rounded-xl"
                style={{ background: "radial-gradient(ellipse at 6% 50%,rgba(99,91,255,0.2) 0%,transparent 60%)" }} />
            )}

            {/* icon */}
            <motion.span
              animate={hovered && !isActive ? { scale: 1.1, rotate: 4 } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.18 }}
              className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
              style={{
                background: isActive ? "rgba(99,91,255,0.24)" : hovered ? "rgba(255,255,255,0.06)" : "transparent",
                boxShadow: isActive ? "0 0 16px rgba(99,91,255,0.42),inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                transition: "background 0.2s,box-shadow 0.2s",
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8}
                style={{
                  color: isActive ? "#C4B5FD" : hovered ? "#A78BFA" : "#4B5563",
                  filter: isActive ? "drop-shadow(0 0 7px rgba(196,181,253,0.85))" : "none",
                  transition: "color 0.2s,filter 0.2s",
                }} />
            </motion.span>

            {/* label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    color: isActive ? "#EDE9FE" : hovered ? "#CBD5E1" : "#4B5563",
                    transition: "color 0.2s",
                  }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </NavLink>
    </Tip>
  );
};

// ─── Main Layout ───────────────────────────────────────────────────────────
const AdminLayout = () => {
  const { logout } = useAuthStore();
  const navigate   = useNavigate();
  const [collapsed, setCollapsed]     = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);
  useSocket();
  useSyncEvents();

  const fetchStats = useAdminStore(s => s.fetchStats);
  useEffect(() => {
    const h = () => fetchStats();
    window.addEventListener("admin:stats_refresh", h);
    return () => window.removeEventListener("admin:stats_refresh", h);
  }, [fetchStats]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="flex min-h-screen" style={{ background: "#060A14" }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: collapsed ? 68 : 256 }}
        transition={{ duration: 0.32, ease: [0.16,1,0.3,1] }}
        className="relative flex flex-col shrink-0 overflow-hidden"
        style={{
          height: "100vh",
          position: "sticky",
          top: 0,
          background: `${NOISE},
            linear-gradient(160deg,rgba(99,91,255,0.07) 0%,rgba(139,92,246,0.03) 45%,transparent 72%),
            linear-gradient(180deg,#0D1121 0%,#0A0E1C 55%,#080C18 100%)`,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "4px 0 48px rgba(0,0,0,0.45),inset -1px 0 0 rgba(99,91,255,0.07)",
        }}
      >
        {/* ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(99,91,255,0.1) 0%,transparent 65%)" }} />
          <div className="absolute bottom-16 -right-16 w-60 h-60 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 65%)" }} />
        </div>

        {/* left edge glow */}
        <div className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
          style={{ background: "linear-gradient(180deg,transparent 0%,rgba(99,91,255,0.6) 35%,rgba(139,92,246,0.4) 65%,transparent 100%)" }} />

        {/* ══ LOGO ══ */}
        <div className="relative flex items-center h-[70px] shrink-0"
          style={{
            padding: collapsed ? "0 14px" : "0 18px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
          <div className="absolute bottom-0 inset-x-3 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.28),transparent)" }} />

          {/* zap icon */}
          <motion.div
            whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
            transition={{ duration: 0.18 }}
            className="relative shrink-0 cursor-pointer"
            onClick={() => navigate("/admin")}
          >
            {/* breathing glow */}
            <motion.div className="absolute inset-0 rounded-xl"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", filter: "blur(11px)", transform: "scale(1.4)" }} />
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg,#7C6FFF 0%,#5B52F0 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.12),0 4px 18px rgba(99,91,255,0.55),inset 0 1px 0 rgba(255,255,255,0.22)",
              }}>
              <Zap size={16} className="text-white" strokeWidth={2.8} />
            </div>
          </motion.div>

          {/* wordmark + badge */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
                className="ml-3 flex flex-col min-w-0 overflow-hidden"
              >
                {/* Sora font — matches landing page exactly */}
                <span style={{
                  fontFamily: "'Sora','Inter',sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  background: "linear-gradient(135deg,#FFFFFF 20%,#A78BFA 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  whiteSpace: "nowrap",
                }}>
                  Skillora
                </span>

                {/* Admin badge */}
                <motion.span
                  whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1 mt-1.5 self-start px-2 py-[3px] rounded-full cursor-default"
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    background: "linear-gradient(135deg,rgba(99,91,255,0.28) 0%,rgba(139,92,246,0.18) 100%)",
                    border: "1px solid rgba(99,91,255,0.35)",
                    color: "#C4B5FD",
                    boxShadow: "0 0 10px rgba(99,91,255,0.22)",
                  }}
                >
                  <Shield size={8} strokeWidth={2.5} />
                  Admin
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ NAV ══ */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: "none", padding: collapsed ? "16px 8px" : "16px 10px" }}>

          {/* section label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 px-2 pb-3">
                <span style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(99,91,255,0.48)",
                }}>
                  Navigation
                </span>
                <div className="flex-1 h-px"
                  style={{ background: "linear-gradient(90deg,rgba(99,91,255,0.2),transparent)" }} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-[3px]">
            {NAV.map((item, i) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} index={i} />
            ))}
          </div>
        </nav>

        {/* ══ BOTTOM ══ */}
        <div style={{ padding: collapsed ? "0 8px 14px" : "0 10px 14px" }}>
          <div className="mb-3 h-px mx-1"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }} />

          {/* sign out */}
          <Tip label="Sign out" show={collapsed && logoutHover}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              onHoverStart={() => setLogoutHover(true)}
              onHoverEnd={() => setLogoutHover(false)}
              animate={logoutHover ? { x: collapsed ? 0 : 3 } : { x: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full flex items-center rounded-xl transition-all duration-200"
              style={{
                gap: collapsed ? 0 : 11,
                padding: collapsed ? "10px 0" : "10px 13px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: logoutHover ? "rgba(239,68,68,0.08)" : "transparent",
                border: logoutHover ? "1px solid rgba(239,68,68,0.16)" : "1px solid transparent",
                backdropFilter: logoutHover ? "blur(10px)" : "none",
              }}
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200"
                style={{
                  background: logoutHover ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.07)",
                  boxShadow: logoutHover ? "0 0 14px rgba(239,68,68,0.28)" : "none",
                }}>
                <LogOut size={15} strokeWidth={2}
                  style={{ color: logoutHover ? "#F87171" : "#4B5563", transition: "color 0.2s" }} />
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}
                    style={{
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      color: logoutHover ? "#F87171" : "#4B5563",
                      transition: "color 0.2s",
                    }}>
                    Sign out
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </Tip>

          {/* collapse toggle */}
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center rounded-xl mt-1 transition-all duration-200"
            style={{
              gap: collapsed ? 0 : 10,
              padding: collapsed ? "8px 0" : "8px 13px",
              justifyContent: collapsed ? "center" : "flex-start",
              color: "rgba(100,116,139,0.5)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#A78BFA"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(100,116,139,0.5)"; }}
          >
            <motion.span animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}>
              <ChevronLeft size={14} strokeWidth={2} />
            </motion.span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}>
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* ══ MAIN ══ */}
      <main className="flex-1 overflow-auto" style={{ background: "#060A14" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
