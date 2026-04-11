import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  CreditCard, Sparkles, Settings, Zap, ChevronLeft,
  ChevronRight, Bot, Bell,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getInitials } from "../../utils/helpers";

// ── Nav structure ─────────────────────────────────────────
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

// ── Tooltip ───────────────────────────────────────────────
const SidebarTooltip = ({ label, children, show }) => (
  <div className="relative group/tip flex">
    {children}
    {show && (
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                      px-2.5 py-1.5 rounded-lg text-xs font-medium text-white
                      bg-[#1E2A3B] border border-white/10 shadow-xl whitespace-nowrap
                      pointer-events-none opacity-0 group-hover/tip:opacity-100
                      transition-opacity duration-150">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4
                        border-transparent border-r-[#1E2A3B]" />
      </div>
    )}
  </div>
);

// ── Single nav item ───────────────────────────────────────
const SidebarItem = ({ to, icon: Icon, label, badge, glow, collapsed }) => (
  <SidebarTooltip label={label} show={collapsed}>
    <NavLink
      to={to}
      className={({ isActive }) => `
        group relative flex items-center gap-3 w-full rounded-xl
        transition-all duration-200 ease-in-out select-none outline-none
        ${collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"}
        ${isActive
          ? "bg-gradient-to-r from-[#635BFF]/20 to-[#635BFF]/5 text-white"
          : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
        }
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active left border */}
          {isActive && (
            <motion.div
              layoutId="active-border"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#635BFF]"
              style={{ boxShadow: "0 0 8px #635BFF" }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.15 }}
            className={`relative shrink-0 ${
              isActive
                ? "text-[#635BFF] drop-shadow-[0_0_6px_rgba(99,91,255,0.8)]"
                : glow
                  ? "text-[#9CA3AF] group-hover:text-[#00D4FF] group-hover:drop-shadow-[0_0_6px_rgba(0,212,255,0.6)]"
                  : "text-[#9CA3AF] group-hover:text-white"
            } transition-all duration-200`}
          >
            <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
          </motion.div>

          {/* Label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className={`text-sm font-medium whitespace-nowrap flex-1 ${
                  isActive ? "text-white" : ""
                }`}
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
              className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full
                         bg-[#635BFF] text-white text-[10px] font-bold
                         flex items-center justify-center shrink-0"
              style={{ boxShadow: "0 0 8px rgba(99,91,255,0.5)" }}
            >
              {badge}
            </motion.span>
          )}

          {/* Active glow bg */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 20% 50%, rgba(99,91,255,0.12) 0%, transparent 70%)",
              }}
            />
          )}
        </>
      )}
    </NavLink>
  </SidebarTooltip>
);

// ── Section label ─────────────────────────────────────────
const SidebarSection = ({ label, collapsed }) => (
  <AnimatePresence>
    {!collapsed && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="px-3 pt-5 pb-1.5 text-[10px] font-semibold tracking-widest text-[#4B5563] uppercase select-none"
      >
        {label}
      </motion.p>
    )}
    {collapsed && <div className="pt-4 pb-1 mx-auto w-4 border-t border-white/5" />}
  </AnimatePresence>
);

// ── Main Sidebar ──────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 248 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col h-screen shrink-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0D1526 0%, #0A1120 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.03), 4px 0 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Left edge accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-px"
        style={{ background: "linear-gradient(180deg, transparent 0%, #635BFF 40%, #00D4FF 70%, transparent 100%)", opacity: 0.4 }} />

      {/* Mesh background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,91,255,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 -right-10 w-48 h-48 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* ── Logo ─────────────────────────────────────────── */}
      <div className={`flex items-center h-16 shrink-0 ${collapsed ? "justify-center px-0" : "px-4"}`}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          className="relative shrink-0 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          {/* Glow behind logo */}
          <div className="absolute inset-0 rounded-xl blur-md opacity-60"
            style={{ background: "linear-gradient(135deg, #635BFF, #00D4FF)" }} />
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)", boxShadow: "0 0 16px rgba(99,91,255,0.5)" }}>
            <Zap size={17} className="text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden"
            >
              <p className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap">Skillora</p>
              <p className="text-[10px] text-[#635BFF] font-medium tracking-wider uppercase whitespace-nowrap">
                Freelancer OS
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2
                      scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <SidebarSection label={section.label} collapsed={collapsed} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom section ────────────────────────────────── */}
      <div className="shrink-0 px-2 pb-3">
        {/* Divider */}
        <div className="mb-3 mx-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        {/* Settings */}
        <SidebarTooltip label="Settings" show={collapsed}>
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              group flex items-center gap-3 w-full rounded-xl
              transition-all duration-200 select-none
              ${collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"}
              ${isActive ? "bg-white/8 text-white" : "text-[#6B7280] hover:text-[#9CA3AF] hover:bg-white/5"}
            `}
          >
            {({ isActive }) => (
              <>
                <Settings size={16} strokeWidth={1.8}
                  className={`shrink-0 transition-all duration-200 ${isActive ? "text-white" : "group-hover:rotate-45"}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap">
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        </SidebarTooltip>

        {/* Collapse toggle */}
        <SidebarTooltip label={collapsed ? "Expand" : ""} show={collapsed}>
          <button
            onClick={onToggle}
            className={`group flex items-center gap-3 w-full rounded-xl mt-0.5
                        text-[#4B5563] hover:text-[#9CA3AF] hover:bg-white/5
                        transition-all duration-200 select-none
                        ${collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"}`}
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ChevronRight size={16} strokeWidth={1.8} className="shrink-0" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap">
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </SidebarTooltip>

        {/* User avatar strip */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="mt-3 mx-1 p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer
                         hover:bg-white/5 transition-colors group"
              style={{ border: "1px solid rgba(255,255,255,0.05)" }}
              onClick={handleLogout}
            >
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center
                              text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #635BFF, #8579FF)" }}>
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-[#4B5563] truncate capitalize">{user?.plan || "free"} plan</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
