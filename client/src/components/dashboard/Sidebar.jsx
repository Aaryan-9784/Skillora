import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Users, CreditCard, Sparkles, Settings, Zap,
  ChevronRight, Bot,
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
          whileHover={{ scale: collapsed ? 1 : 1.015 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className={`
            relative flex items-center w-full select-none cursor-pointer
            rounded-xl overflow-hidden transition-colors duration-200
            ${collapsed ? "justify-center px-0 py-[11px]" : "gap-3 px-3 py-[9px]"}
          `}
          style={{
            background: isActive
              ? "linear-gradient(135deg, rgba(99,91,255,0.22) 0%, rgba(139,92,246,0.10) 100%)"
              : "transparent",
          }}
          onMouseEnter={e => {
            if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={e => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }}
        >
          {/* ── Active left accent bar ── */}
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              className="absolute left-0 inset-y-[6px] w-[3px] rounded-r-full"
              style={{
                background: "linear-gradient(180deg, #635BFF, #A78BFA)",
                boxShadow: "0 0 10px rgba(99,91,255,0.8)",
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          {/* ── Active background shimmer ── */}
          {isActive && (
            <span
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 15% 50%, rgba(99,91,255,0.18) 0%, transparent 65%)",
              }}
            />
          )}

          {/* ── Icon ── */}
          <motion.span
            animate={isActive ? { y: 0 } : {}}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.15 }}
            className="relative shrink-0 flex items-center justify-center"
            style={{
              color: isActive
                ? "#A78BFA"
                : glow
                  ? undefined
                  : "#6B7280",
              filter: isActive
                ? "drop-shadow(0 0 7px rgba(167,139,250,0.9))"
                : undefined,
            }}
          >
            <Icon
              size={17}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={
                !isActive && glow
                  ? "text-[#6B7280] group-hover:text-[#00D4FF] transition-colors duration-200"
                  : ""
              }
            />
          </motion.span>

          {/* ── Label ── */}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex-1 text-sm font-medium whitespace-nowrap truncate"
                style={{ color: isActive ? "#F5F3FF" : "#9CA3AF" }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* ── Badge ── */}
          {badge && !collapsed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="ml-auto shrink-0 min-w-[20px] h-5 px-1.5 rounded-full
                         flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #635BFF, #8B5CF6)",
                boxShadow: "0 0 10px rgba(99,91,255,0.55)",
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
        className={`flex items-center gap-2 px-3 ${first ? "pt-3 pb-1.5" : "pt-5 pb-1.5"}`}
      >
        {/* Divider line */}
        {!first && (
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
        )}
        <span
          className="text-[9.5px] font-bold tracking-[0.14em] uppercase shrink-0"
          style={{ color: "#374151" }}
        >
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </motion.div>
    ) : (
      <motion.div
        key="dot"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${first ? "pt-3" : "pt-4"} pb-1 flex justify-center`}
      >
        <div className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
      </motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// USER CARD (bottom)
// ─────────────────────────────────────────────────────────
const UserCard = ({ user, collapsed, onLogout }) => (
  <AnimatePresence>
    {!collapsed && (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={onLogout}
        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left
                   transition-all duration-200 group"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.border = "1px solid rgba(99,91,255,0.25)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Avatar with gradient ring */}
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center
                       text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 12px rgba(99,91,255,0.45)",
            }}
          >
            {getInitials(user?.name)}
          </div>
          {/* Online dot */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{
              background: "#22C55E",
              borderColor: "#0A1120",
              boxShadow: "0 0 6px rgba(34,197,94,0.8)",
            }}
          />
        </div>

        {/* Name + plan */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "#F9FAFB" }}>
            {user?.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="text-[9px] font-semibold px-1.5 py-px rounded-full capitalize"
              style={{
                background: "rgba(99,91,255,0.18)",
                color: "#A78BFA",
                border: "1px solid rgba(99,91,255,0.25)",
              }}
            >
              {user?.plan || "free"}
            </span>
          </div>
        </div>
      </motion.button>
    )}

    {/* Collapsed avatar */}
    {collapsed && (
      <Tooltip label={user?.name || "Profile"} show>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onLogout}
          className="w-full flex justify-center py-2"
        >
          <div
            className="relative w-8 h-8 rounded-xl flex items-center justify-center
                       text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF, #8B5CF6)",
              boxShadow: "0 0 10px rgba(99,91,255,0.4)",
            }}
          >
            {getInitials(user?.name)}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
              style={{ background: "#22C55E", borderColor: "#0A1120" }}
            />
          </div>
        </motion.button>
      </Tooltip>
    )}
  </AnimatePresence>
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
        className={`flex items-center h-[60px] shrink-0 ${
          collapsed ? "justify-center px-0" : "px-4"
        }`}
      >
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="relative shrink-0 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          {/* Pulse glow */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(135deg, #635BFF, #00D4FF)",
              filter: "blur(8px)",
            }}
          />
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)",
              boxShadow: "0 0 18px rgba(99,91,255,0.55)",
            }}
          >
            <Zap size={17} className="text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Wordmark */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden"
            >
              <p
                className="text-[15px] font-extrabold tracking-tight whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Skillora
              </p>
              <p
                className="text-[9.5px] font-semibold tracking-[0.18em] uppercase whitespace-nowrap"
                style={{ color: "#635BFF" }}
              >
                Freelancer OS
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
      <div className="shrink-0 px-2 pb-3 space-y-1">
        {/* Divider */}
        <div
          className="mb-2 mx-1 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
          }}
        />

        {/* Settings */}
        <Tooltip label="Settings" show={collapsed}>
          <NavLink to="/settings">
            {({ isActive }) => (
              <motion.div
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center w-full rounded-xl transition-colors duration-200 select-none cursor-pointer
                  ${collapsed ? "justify-center px-0 py-[11px]" : "gap-3 px-3 py-[9px]"}
                  ${isActive ? "bg-white/8" : "hover:bg-white/5"}`}
              >
                <Settings
                  size={16}
                  strokeWidth={1.8}
                  className="shrink-0 transition-transform duration-300 hover:rotate-45"
                  style={{ color: isActive ? "#A78BFA" : "#6B7280" }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                      style={{ color: isActive ? "#F5F3FF" : "#9CA3AF" }}
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        </Tooltip>

        {/* Collapse toggle */}
        <Tooltip label={collapsed ? "Expand sidebar" : ""} show={collapsed}>
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggle}
            className={`flex items-center w-full rounded-xl transition-colors duration-200 select-none
              hover:bg-white/5
              ${collapsed ? "justify-center px-0 py-[11px]" : "gap-3 px-3 py-[9px]"}`}
          >
            <motion.span
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0"
            >
              <ChevronRight size={16} strokeWidth={1.8} style={{ color: "#4B5563" }} />
            </motion.span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                  style={{ color: "#6B7280" }}
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </Tooltip>

        {/* User card */}
        <div className="mt-1">
          <UserCard user={user} collapsed={collapsed} onLogout={handleLogout} />
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
