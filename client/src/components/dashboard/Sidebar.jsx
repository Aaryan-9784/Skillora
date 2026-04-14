import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Users, CreditCard, Sparkles, Settings, Zap,
  ChevronRight, Bot, LogOut,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getInitials } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/projects",  icon: FolderKanban,    label: "Projects" },
      { to: "/tasks",     icon: CheckSquare,     label: "Tasks" },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { to: "/clients",  icon: Users,     label: "Clients" },
      { to: "/payments", icon: CreditCard, label: "Payments", badge: 3 },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { to: "/skills", icon: Sparkles, label: "Skills" },
      { to: "/ai",     icon: Bot,      label: "AI Assistant", glow: true },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// TOOLTIP (collapsed mode)
// ─────────────────────────────────────────────────────────
const Tooltip = ({ label, show, children }) => (
  <div className="relative group/tip w-full">
    {children}
    {show && (
      <div
        className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[99]
                   px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap
                   opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150"
        style={{
          background: "rgba(15,23,42,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        {label}
        {/* Arrow */}
        <span className="absolute right-full top-1/2 -translate-y-1/2
                         border-4 border-transparent border-r-[rgba(15,23,42,0.97)]" />
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────
// NAV ITEM
// ─────────────────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, badge, glow, collapsed }) => (
  <Tooltip label={label} show={collapsed}>
    <NavLink to={to} end={to === "/dashboard"}>
      {({ isActive }) => (
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className={`
            relative flex items-center w-full select-none cursor-pointer
            rounded-xl overflow-hidden
            ${collapsed ? "justify-center px-0 py-[13px]" : "gap-3 px-3 py-[10px]"}
          `}
          style={{
            background: isActive
              ? "linear-gradient(135deg, rgba(99,91,255,0.18) 0%, rgba(139,92,246,0.08) 100%)"
              : "transparent",
            transition: "background 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,0.06)";
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        >
          {/* Active left accent bar — spring animated */}
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              className="absolute left-0 inset-y-[7px] w-[3px] rounded-r-full"
              style={{
                background: "linear-gradient(180deg, #8B5CF6, #635BFF)",
                boxShadow: "0 0 12px rgba(99,91,255,0.9)",
              }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}

          {/* Active radial shimmer */}
          {isActive && (
            <span className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 10% 50%, rgba(99,91,255,0.15) 0%, transparent 70%)" }} />
          )}

          {/* Icon container */}
          <span
            className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              background: isActive ? "rgba(99,91,255,0.2)" : "transparent",
              boxShadow: isActive ? "0 0 14px rgba(99,91,255,0.35), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
            }}
          >
            <Icon
              size={16}
              strokeWidth={isActive ? 2.2 : 1.8}
              style={{
                color: isActive ? "#A78BFA" : glow ? "#6B7280" : "#6B7280",
                filter: isActive ? "drop-shadow(0 0 6px rgba(167,139,250,0.8))" : "none",
                transition: "color 0.18s, filter 0.18s",
              }}
            />
          </span>

          {/* Label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="flex-1 text-[13px] font-semibold whitespace-nowrap truncate"
                style={{
                  color: isActive ? "#EDE9FE" : "#6B7280",
                  letterSpacing: isActive ? "-0.01em" : "0",
                  transition: "color 0.18s",
                }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge */}
          {badge && !collapsed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="ml-auto shrink-0 min-w-[20px] h-5 px-1.5 rounded-full
                         flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #635BFF, #8B5CF6)",
                boxShadow: "0 0 10px rgba(99,91,255,0.5)",
              }}
            >
              {badge}
            </motion.span>
          )}
        </motion.div>
      )}
    </NavLink>
  </Tooltip>
);

// ─────────────────────────────────────────────────────────
// SECTION DIVIDER + LABEL
// ─────────────────────────────────────────────────────────
const SectionLabel = ({ label, collapsed, first }) => (
  <AnimatePresence>
    {!collapsed ? (
      <motion.div
        key="label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`flex items-center gap-2.5 px-3 ${first ? "pt-4 pb-2" : "pt-6 pb-2"}`}
      >
        {!first && (
          <div className="flex-1 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
        )}
        <span
          className="text-[9px] font-bold tracking-[0.18em] uppercase shrink-0"
          style={{ color: "rgba(99,91,255,0.45)" }}
        >
          {label}
        </span>
        <div className="flex-1 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
      </motion.div>
    ) : (
      <motion.div
        key="dot"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${first ? "pt-3" : "pt-5"} pb-1 flex justify-center`}
      >
        <div className="w-1 h-1 rounded-full" style={{ background: "rgba(99,91,255,0.3)" }} />
      </motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// USER CARD (bottom) — profile clickable → settings, logout button
// ─────────────────────────────────────────────────────────
const UserCard = ({ user, collapsed, onToggle, onLogout, onSettings }) => (
  <div className="space-y-1">
    <AnimatePresence>
      {!collapsed ? (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(99,91,255,0.07) 0%, rgba(255,255,255,0.025) 100%)",
            border: "1px solid rgba(99,91,255,0.18)",
            boxShadow: "0 0 0 1px rgba(99,91,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Top glow line */}
          <div className="absolute inset-x-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.5), transparent)" }} />

          {/* ── Clickable profile area → Settings ── */}
          <button
            onClick={onSettings}
            className="w-full flex items-center gap-3 px-3 py-3 transition-all duration-200 group relative overflow-hidden"
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(99,91,255,0.1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #635BFF 0%, #A78BFA 100%)",
                  boxShadow: "0 0 18px rgba(99,91,255,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                {getInitials(user?.name)}
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }} />
            </div>

            {/* Name + role + plan */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate leading-tight" style={{ color: "#F9FAFB" }}>
                {user?.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{
                    background: "rgba(99,91,255,0.2)",
                    color: "#A78BFA",
                    border: "1px solid rgba(99,91,255,0.3)",
                    letterSpacing: "0.03em",
                  }}>
                  {user?.role || "freelancer"}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <motion.div
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              animate={{ x: 0 }}
              whileHover={{ x: 2 }}
            >
              <ChevronRight size={14} style={{ color: "#635BFF" }} />
            </motion.div>
          </button>

          {/* ── Logout button ── */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all duration-200 group/logout"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                e.currentTarget.style.color = "#F87171";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#4B5563";
              }}
            >
              <LogOut size={13} strokeWidth={2} />
              Sign out
            </button>
          </div>
        </motion.div>
      ) : (
        /* ── Collapsed mode ── */
        <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-0.5">
          {/* Avatar → Settings */}
          <Tooltip label="Settings" show>
            <button onClick={onSettings} className="w-full flex justify-center py-1.5">
              <div className="relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #635BFF, #8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.4)" }}>
                {getInitials(user?.name)}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                  style={{ background: "#22C55E", borderColor: "#0A1120" }} />
              </div>
            </button>
          </Tooltip>
          {/* Logout */}
          <Tooltip label="Sign out" show>
            <button onClick={onLogout}
              className="w-full flex justify-center py-1.5 transition-colors duration-150"
              style={{ color: "#4B5563" }}
              onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>
              <LogOut size={14} strokeWidth={1.8} />
            </button>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Collapse toggle — always outside the profile card ── */}
    <Tooltip label={collapsed ? "Expand sidebar" : ""} show={collapsed}>
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
        onClick={onToggle}
        className={`flex items-center w-full rounded-xl transition-colors duration-200 select-none hover:bg-white/5
          ${collapsed ? "justify-center px-0 py-[11px]" : "gap-2 px-3 py-2"}`}
      >
        <motion.span
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0"
        >
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

// ─────────────────────────────────────────────────────────
// MAIN SIDEBAR
// ─────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 244 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col h-screen shrink-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0B1220 0%, #080E1A 55%, #060A14 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* ── Ambient glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,91,255,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-16 -right-16 w-56 h-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* ── Left edge gradient strip ── */}
      <div
        className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(99,91,255,0.5) 35%, rgba(0,212,255,0.35) 65%, transparent 100%)",
        }}
      />

      {/* ════════════════════════════════════════
          LOGO
      ════════════════════════════════════════ */}
      <div
        className={`flex items-center h-[72px] shrink-0 relative ${
          collapsed ? "justify-center px-0" : "px-4"
        }`}
      >
        {/* Subtle bottom divider */}
        <div className="absolute bottom-0 inset-x-3 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.25), transparent)" }} />

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
          className="relative shrink-0 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          {/* Ambient glow behind icon */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", filter: "blur(12px)", transform: "scale(1.3)" }}
          />
          {/* Icon box */}
          <div
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #7C6FFF 0%, #5B52F0 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 4px 16px rgba(99,91,255,0.5), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            <Zap size={18} className="text-white" strokeWidth={2.8} />
          </div>
        </motion.div>

        {/* Wordmark */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
              className="ml-3 overflow-hidden select-none"
            >
              <p
                className="text-[18px] font-black tracking-[-0.02em] whitespace-nowrap leading-none"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 20%, #A78BFA 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Skillora
              </p>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mt-1 whitespace-nowrap"
                style={{ color: "rgba(99,91,255,0.6)", letterSpacing: "0.22em" }}>
                workspace
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════
          NAV
      ════════════════════════════════════════ */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label}>
            <SectionLabel label={section.label} collapsed={collapsed} first={si === 0} />
            <div className="space-y-[2px]">
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ════════════════════════════════════════
          BOTTOM
      ════════════════════════════════════════ */}
      <div className="shrink-0 px-2 pb-3">
        {/* Divider */}
        <div className="mb-2 mx-1 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />

        {/* Merged user card with collapse + settings + logout */}
        <UserCard
          user={user}
          collapsed={collapsed}
          onToggle={onToggle}
          onLogout={handleLogout}
          onSettings={() => navigate("/settings")}
        />
      </div>
    </motion.aside>
  );
};

export default Sidebar;
