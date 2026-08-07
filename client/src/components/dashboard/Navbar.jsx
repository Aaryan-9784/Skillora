import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, ChevronDown, LogOut,
  User, Command, Plus, Zap, FolderKanban,
  CheckSquare, Users, CreditCard, Sparkles,
  FolderPlus, ListPlus, UserPlus, FileText, Home,
  ChevronRight, LayoutDashboard, Settings, Bot, MessageSquare,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import NotificationsPanel from "./NotificationsPanel";
import CommandPalette from "../ui/CommandPalette";
import useCommandPalette from "../../hooks/useCommandPalette";
import useClickOutside from "../../hooks/useClickOutside";
import { getInitials } from "../../utils/helpers";

const PATH_CONFIG = {
  "/dashboard":    { title: "Dashboard",       icon: LayoutDashboard },
  "/projects":     { title: "Projects",        icon: FolderKanban },
  "/tasks":        { title: "Tasks",           icon: CheckSquare },
  "/clients":      { title: "Clients",         icon: Users },
  "/messages":     { title: "Messages",        icon: MessageSquare },
  "/payments":     { title: "Payments",        icon: CreditCard },
  "/invoices":     { title: "Payments",        icon: CreditCard },
  "/payments/new": { title: "New Invoice",     icon: FileText },
  "/skills":       { title: "Skills",          icon: Sparkles },
  "/profile":      { title: "Profile",         icon: User },
  "/settings":     { title: "Settings",        icon: Settings },
};

// ─── MAIN NAVBAR ───────────────────────────────────────────────────────────
const Navbar = ({ onCommandPalette }) => {
  const { user, logout }                  = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const dropdownRef                       = useRef(null);
  const notifRef                          = useRef(null);

  const { isOpen: cmdOpen, open: openCmd, close: closeCmd } = useCommandPalette();
  const navigate = useNavigate();
  const location = useLocation();

  useClickOutside(dropdownRef, () => setDropdownOpen(false), { enabled: dropdownOpen });
  useClickOutside(notifRef, () => setNotifOpen(false), { enabled: notifOpen });

  useEffect(() => {
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const currentConfig = PATH_CONFIG[location.pathname] || {
    title: location.pathname.startsWith("/projects/") ? "Project Details" :
           location.pathname.startsWith("/clients/") ? "Client Details" :
           location.pathname.startsWith("/payments/") ? "Invoice Details" : "Dashboard",
    icon: location.pathname.startsWith("/projects/") ? FolderKanban :
          location.pathname.startsWith("/clients/") ? Users :
          location.pathname.startsWith("/payments/") ? CreditCard : LayoutDashboard,
  };

  const PageIcon = currentConfig.icon;
  const pageTitle = currentConfig.title;

  useEffect(() => { fetchUnreadCount(); }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 gap-3"
        style={{
          background: "linear-gradient(90deg,rgba(9,15,28,0.94) 0%,rgba(11,18,32,0.94) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
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

          <span className="font-bold text-xs text-[#C4B5FD] shrink-0 select-none">
            Freelancer Portal
          </span>

          <span className="text-gray-500 font-bold text-sm select-none">/</span>

          <div className="flex items-center font-bold text-white text-xs">
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
                <p className="text-[10px] font-medium text-purple-400 capitalize leading-tight mt-0.5">{user?.role || "freelancer"}</p>
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
                          <p className="text-xs text-purple-400 font-medium capitalize leading-tight mt-0.5">{user?.role || "freelancer"}</p>
                          {user?.email && (
                            <p className="text-[11px] text-gray-400 font-medium truncate leading-tight mt-1">{user.email}</p>
                          )}
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
                        onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mt-1 cursor-pointer"
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

      <CommandPalette isOpen={cmdOpen} onClose={closeCmd} />
    </>
  );
};

export default Navbar;
