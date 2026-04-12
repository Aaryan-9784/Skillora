import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, ChevronDown, LogOut,
  User, Command, Plus, Zap, FolderKanban,
  CheckSquare, Users, CreditCard, Sparkles,
  FolderPlus, ListPlus, UserPlus, FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import NotificationsPanel from "./NotificationsPanel";
import CommandPalette from "../ui/CommandPalette";
import useCommandPalette from "../../hooks/useCommandPalette";
import { getInitials } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// ICON BUTTON
// ─────────────────────────────────────────────────────────
const NavIconBtn = ({ onClick, children, badge, title }) => (
  <motion.button
    whileHover={{ scale: 1.06, y: -1 }}
    whileTap={{ scale: 0.94 }}
    onClick={onClick}
    title={title}
    className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
    style={{ color: "#6B7280" }}
    onMouseEnter={e => {
      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      e.currentTarget.style.color = "#E5E7EB";
      e.currentTarget.style.boxShadow = "0 0 14px rgba(99,91,255,0.18)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "#6B7280";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {children}
    {badge > 0 && (
      <span
        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full
                   flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 8px rgba(99,91,255,0.6)" }}
      >
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </motion.button>
);

// ─────────────────────────────────────────────────────────
// MAIN NAVBAR
// ─────────────────────────────────────────────────────────
const Navbar = ({ onCommandPalette }) => {
  const { user, logout }                  = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [createOpen, setCreateOpen]       = useState(false);
  const { isOpen: cmdOpen, open: openCmd, close: closeCmd } = useCommandPalette();
  const navigate = useNavigate();

  useEffect(() => { fetchUnreadCount(); }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const CREATE_ITEMS = [
    { icon: FolderPlus, label: "New Project", path: "/projects", color: "#635BFF" },
    { icon: ListPlus,   label: "New Task",    path: "/tasks",    color: "#22C55E" },
    { icon: UserPlus,   label: "New Client",  path: "/clients",  color: "#F59E0B" },
    { icon: FileText,   label: "New Invoice", path: "/payments/new", color: "#00D4FF" },
  ];

  const PROFILE_ITEMS = [
    { icon: User, label: "Profile", action: () => navigate("/settings?tab=profile") },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center h-14 px-5 gap-3"
        style={{
          background: "linear-gradient(90deg,rgba(9,15,28,0.94) 0%,rgba(11,18,32,0.94) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top shimmer line */}
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.35),rgba(0,212,255,0.2),transparent)" }} />

        {/* ── SEARCH BAR ── */}
        <motion.button
          onClick={openCmd}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="hidden md:flex items-center gap-2.5 h-9 px-4 rounded-xl flex-1 max-w-[360px] text-left transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.border = "1px solid rgba(99,91,255,0.35)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(99,91,255,0.12)";
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
            <kbd className="flex items-center justify-center w-5 h-5 rounded text-[10px]"
              style={{ background: "rgba(255,255,255,0.06)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Command size={9} />
            </kbd>
            <kbd className="flex items-center justify-center w-5 h-5 rounded text-[10px]"
              style={{ background: "rgba(255,255,255,0.06)", color: "#4B5563", border: "1px solid rgba(255,255,255,0.08)" }}>
              K
            </kbd>
          </div>
        </motion.button>

        <div className="flex-1" />

        {/* ── RIGHT ACTIONS ── */}
        <div className="flex items-center gap-1">

          {/* + New button with dropdown */}
          <div className="relative mr-1">
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCreateOpen((o) => !o)}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold text-white transition-all duration-150"
              style={{
                background: "linear-gradient(135deg,#635BFF 0%,#8B5CF6 100%)",
                boxShadow: "0 0 16px rgba(99,91,255,0.35)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 24px rgba(99,91,255,0.55)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 16px rgba(99,91,255,0.35)"}
            >
              <Plus size={13} strokeWidth={2.5} />
              New
            </motion.button>

            {/* Create dropdown */}
            <AnimatePresence>
              {createOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCreateOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-10 z-20 w-52 rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 0 0 1px rgba(99,91,255,0.12), 0 24px 48px rgba(0,0,0,0.7), 0 0 40px rgba(99,91,255,0.06)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />
                    <div className="px-4 pt-3.5 pb-2">
                      <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase"
                        style={{ color: "#374151" }}>Create new</p>
                    </div>
                    <div className="px-2 pb-2 flex flex-col gap-0.5">
                      {CREATE_ITEMS.map(({ icon: Icon, label, path, color }, i) => (
                        <motion.button
                          key={label}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => { navigate(path); setCreateOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = `${color}12`;
                            e.currentTarget.style.color = "#F9FAFB";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#9CA3AF";
                          }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: `${color}18`,
                              border: `1px solid ${color}28`,
                              boxShadow: `0 0 12px ${color}15`,
                            }}>
                            <Icon size={15} style={{ color }} />
                          </div>
                          <span className="font-medium">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-0.5" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Notifications */}
          <div className="relative">
            <NavIconBtn onClick={() => setNotifOpen((o) => !o)} badge={unreadCount} title="Notifications">
              <Bell size={15} />
            </NavIconBtn>
            <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-0.5" style={{ background: "rgba(255,255,255,0.07)" }} />

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
                style={{ background: "linear-gradient(135deg,#635BFF,#8579FF)", boxShadow: "0 0 12px rgba(99,91,255,0.4)" }}>
                {getInitials(user?.name)}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0A1120]"
                  style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: "#F9FAFB" }}>
                  {user?.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] leading-none capitalize" style={{ color: "#635BFF" }}>
                  {user?.plan || "free"}
                </p>
              </div>

              <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} style={{ color: "#6B7280" }} />
              </motion.div>
            </motion.button>

            {/* Profile dropdown */}
            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-11 z-20 w-60 rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(160deg,rgba(12,19,36,0.99) 0%,rgba(8,14,26,0.99) 100%)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 0 0 1px rgba(99,91,255,0.1), 0 24px 56px rgba(0,0,0,0.7), 0 0 40px rgba(99,91,255,0.06)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />

                    {/* User info */}
                    <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
                            style={{
                              background: "linear-gradient(135deg,#635BFF,#8579FF)",
                              boxShadow: "0 0 20px rgba(99,91,255,0.45)",
                            }}>
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
                            <Zap size={9} style={{ color: "#635BFF" }} />
                            <span className="text-[10px] font-bold capitalize tracking-wide" style={{ color: "#A78BFA" }}>
                              {user?.plan || "free"} plan
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2 px-2">
                      {PROFILE_ITEMS.map(({ icon: Icon, label, action }) => (
                        <motion.button
                          key={label}
                          whileHover={{ x: 2 }}
                          onClick={() => { action(); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#F9FAFB"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                        >
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <Icon size={13} />
                          </div>
                          <span className="font-medium">{label}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <motion.button
                        whileHover={{ x: 2 }}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mt-1"
                        style={{ color: "#EF4444" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
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

      <CommandPalette isOpen={cmdOpen} onClose={closeCmd} />
    </>
  );
};

export default Navbar;
