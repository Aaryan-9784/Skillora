import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Folder, ListTodo,
  Users, CreditCard, Sparkles, Settings, Zap,
  ChevronRight, Bot, LogOut, User, MessageSquare,
  ShoppingBag, UserCheck,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getInitials } from "../../utils/helpers";

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/projects",  icon: Folder,          label: "Projects" },
      { to: "/tasks",     icon: ListTodo,        label: "Tasks" },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { to: "/clients",  icon: Users,         label: "Clients" },
      { to: "/payments", icon: CreditCard,    label: "Payments" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { to: "/marketplace", icon: ShoppingBag, label: "Explore Jobs" },
      { to: "/skills",      icon: Sparkles,    label: "Skills" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { to: "/profile",  icon: User,     label: "Profile" },
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
const NavItem = ({ to, icon: Icon, label, badge, glow, collapsed }) => (
  <Tooltip label={label} show={collapsed}>
    <NavLink to={to} end={to === "/dashboard"} className="block">
      {({ isActive }) => (
        <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}
          className={`relative flex items-center w-full select-none cursor-pointer rounded-xl overflow-hidden
            ${collapsed ? "justify-center px-0 py-[13px]" : "gap-3 px-3 py-[10px]"}`}
          style={{
            background: isActive ? "linear-gradient(135deg,rgba(99,91,255,0.18) 0%,rgba(139,92,246,0.08) 100%)" : "transparent",
            transition: "background 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; } }}
        >
          {isActive && (
            <motion.span layoutId="freelancer-nav-pill"
              className="absolute left-0 inset-y-[7px] w-[3px] rounded-r-full"
              style={{ background: "linear-gradient(180deg,#8B5CF6,#635BFF)", boxShadow: "0 0 12px rgba(99,91,255,0.9)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }} />
          )}
          {isActive && (
            <span className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 10% 50%,rgba(99,91,255,0.15) 0%,transparent 70%)" }} />
          )}
          <span className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              background: isActive ? "rgba(99,91,255,0.25)" : "transparent",
              border: isActive ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
              boxShadow: isActive ? "0 0 14px rgba(99,91,255,0.35),inset 0 1px 0 rgba(255,255,255,0.1)" : "none"
            }}>
            <Icon size={16} strokeWidth={isActive ? 2.2 : 2}
              style={{ color: isActive ? "#A78BFA" : "#9CA3AF", filter: isActive ? "drop-shadow(0 0 6px rgba(167,139,250,0.8))" : "none", transition: "color 0.18s,filter 0.18s" }} />
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}
                className="flex-1 text-[13px] font-semibold whitespace-nowrap truncate"
                style={{ color: isActive ? "#EDE9FE" : "#9CA3AF", letterSpacing: isActive ? "-0.01em" : "0", transition: "color 0.18s" }}>
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {badge && !collapsed && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="ml-auto shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.5)" }}>
              {badge}
            </motion.span>
          )}
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
          <Tooltip label={user?.name || "Freelancer"} show>
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

// ─── Main Sidebar ──────────────────────────────────────────────────────────
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
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
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
                  FREELANCER PORTAL
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
        <UserCard user={user} collapsed={collapsed} onToggle={onToggle} onLogout={handleLogout} navigate={navigate} />
      </div>
    </motion.aside>
  );
};

export default Sidebar;

