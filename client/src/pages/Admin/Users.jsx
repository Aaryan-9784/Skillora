import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trash2, Shield, UserCheck, Users, UserCog,
  TrendingUp, MoreVertical, ChevronLeft, ChevronRight,
  ArrowUpDown, Check, X, RefreshCw, Ban, CheckCircle,
  CreditCard, Download, ChevronDown, Mail, Eye,
  Activity, Calendar, Zap, Crown,
} from "lucide-react";
import useAdminStore from "../../store/adminStore";
import useConfirm from "../../hooks/useConfirm";

// ─── tokens ────────────────────────────────────────────────────────────────
const LIMIT = 10;
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`;

const ROLE = {
  admin:      { label: "Admin",      color: "#A78BFA", bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.3)",  dot: "#A78BFA" },
  freelancer: { label: "Freelancer", color: "#38BDF8", bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.28)", dot: "#38BDF8" },
  client:     { label: "Client",     color: "#34D399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)", dot: "#34D399" },
};
const PLAN = {
  free:    { label: "Free",    color: "#94A3B8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)"  },
  pro:     { label: "Pro",     color: "#818CF8", bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.32)" },
  premium: { label: "Premium", color: "#FBBF24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"   },
};
const AVATAR_COLORS = ["#635BFF","#38BDF8","#A78BFA","#FBBF24","#34D399","#F43F5E","#FB923C"];

// ─── Avatar ────────────────────────────────────────────────────────────────
const Avatar = ({ name = "", avatar, size = 36 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const color    = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  if (avatar) return (
    <img src={avatar} alt={name} className="rounded-full object-cover shrink-0 ring-2 ring-white/10"
      style={{ width: size, height: size }} />
  );
  return (
    <div className="rounded-full shrink-0 flex items-center justify-center font-bold text-white select-none"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
        fontSize: size * 0.33,
        boxShadow: `0 0 0 2px rgba(255,255,255,0.06), 0 0 12px ${color}35`,
      }}>
      {initials}
    </div>
  );
};

// ─── Badges ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const c = ROLE[role] || ROLE.freelancer;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot, boxShadow: `0 0 5px ${c.dot}` }} />
      {c.label}
    </span>
  );
};

const PlanBadge = ({ plan }) => {
  const c = PLAN[plan] || PLAN.free;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {c.label}
    </span>
  );
};

const StatusBadge = ({ active }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
    style={{ color: active !== false ? "#4ADE80" : "#FBBF24" }}>
    <motion.span
      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-1.5 h-1.5 rounded-full"
      style={{ background: active !== false ? "#4ADE80" : "#FBBF24", boxShadow: `0 0 6px ${active !== false ? "#4ADE80" : "#FBBF24"}` }}
    />
    {active !== false ? "Active" : "Suspended"}
  </span>
);

// ─── KPI Card ──────────────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, color, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="relative overflow-hidden rounded-2xl p-5 cursor-default group"
    style={{
      background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
      border: `1px solid ${color}25`,
      backdropFilter: "blur(16px)",
    }}
  >
    {/* corner glow */}
    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none transition-all duration-500 group-hover:scale-150"
      style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }} />
    {/* top line */}
    <div className="absolute inset-x-0 top-0 h-px"
      style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />

    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}35`, boxShadow: `0 0 20px ${color}20` }}>
        <Icon size={19} style={{ color }} />
      </div>
    </div>
    <p className="text-[28px] font-black text-white tracking-tight leading-none mb-1">{value ?? "—"}</p>
    <p className="text-[12px] font-semibold" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</p>
    {sub && <p className="text-[11px] mt-1" style={{ color: "rgba(100,116,139,0.55)" }}>{sub}</p>}
  </motion.div>
);

// ─── Filter Dropdown ───────────────────────────────────────────────────────
const FilterDrop = ({ label, options, value, onChange, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const sel = options.find(o => o.value === value);
  const active = !!value;
  return (
    <div className="relative" ref={ref}>
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200"
        style={{
          background: active ? "rgba(99,91,255,0.18)" : "rgba(255,255,255,0.05)",
          border: active ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.09)",
          color: active ? "#A78BFA" : "rgba(148,163,184,0.8)",
          boxShadow: active ? "0 0 12px rgba(99,91,255,0.15)" : "none",
        }}>
        {Icon && <Icon size={12} />}
        {sel?.label || label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={11} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }} transition={{ duration: 0.15 }}
            className="absolute top-11 left-0 z-50 w-44 rounded-2xl overflow-hidden py-1.5"
            style={{ background: "rgba(10,14,30,0.98)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            {options.map(opt => (
              <button key={opt.value} onClick={() => { onChange(opt.value === value ? "" : opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-medium transition-all"
                style={{ color: opt.value === value ? "#A78BFA" : "rgba(203,213,225,0.85)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {opt.label}
                {opt.value === value && <Check size={12} style={{ color: "#A78BFA" }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Action Menu ───────────────────────────────────────────────────────────
const ActionMenu = ({ user, onView, onRoleToggle, onToggleActive, onPlanChange, onDelete }) => {
  const [open, setOpen]       = useState(false);
  const [planSub, setPlanSub] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setPlanSub(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const close = fn => () => { fn(); setOpen(false); setPlanSub(false); };

  const items = [
    { icon: Eye,       label: "View Profile",  fn: close(onView),          color: "#A78BFA" },
    { icon: Shield,    label: user.role === "admin" ? "Remove Admin" : "Make Admin", fn: close(onRoleToggle), color: "#818CF8" },
    { icon: user.isActive !== false ? Ban : CheckCircle,
                       label: user.isActive !== false ? "Suspend" : "Activate", fn: close(onToggleActive), color: user.isActive !== false ? "#FBBF24" : "#4ADE80" },
    { icon: CreditCard,label: "Change Plan",   fn: () => setPlanSub(o => !o), color: "#38BDF8", sub: true },
    { icon: Trash2,    label: "Delete",        fn: close(onDelete),        color: "#F87171", danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{ background: open ? "rgba(99,91,255,0.15)" : "transparent", color: open ? "#A78BFA" : "rgba(100,116,139,0.6)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#A78BFA"; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(100,116,139,0.6)"; } }}>
        <MoreVertical size={15} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }} transition={{ duration: 0.15, ease: [0.16,1,0.3,1] }}
            className="absolute right-0 top-10 z-50 w-52 rounded-2xl overflow-hidden py-1.5"
            style={{ background: "linear-gradient(145deg,rgba(13,17,38,0.99),rgba(8,12,28,0.99))", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(28px)", boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,91,255,0.08)" }}
            onClick={e => e.stopPropagation()}>
            {items.map(({ icon: Icon, label, fn, color, sub, danger }) => (
              <div key={label}>
                <button onClick={fn}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium transition-all"
                  style={{ color: danger ? "#F87171" : "rgba(203,213,225,0.85)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.1)" : `${color}12`; e.currentTarget.style.color = color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = danger ? "#F87171" : "rgba(203,213,225,0.85)"; }}>
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}15` }}>
                    <Icon size={12} style={{ color }} />
                  </span>
                  {label}
                  {sub && <ChevronDown size={11} className="ml-auto" style={{ transform: planSub ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
                </button>
                {sub && planSub && (
                  <div className="mx-3 mb-1 rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {["free","pro","premium"].map(p => (
                      <button key={p} onClick={() => { onPlanChange(p); setOpen(false); setPlanSub(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold capitalize transition-all"
                        style={{ color: user.plan === p ? "#A78BFA" : "rgba(148,163,184,0.7)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {p}
                        {user.plan === p && <Check size={10} style={{ color: "#A78BFA" }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── User Drawer ───────────────────────────────────────────────────────────
const UserDrawer = ({ user, onClose, onRoleToggle, onToggleActive, onPlanChange, onDelete }) => {
  const roleColor = ROLE[user?.role]?.color || "#A78BFA";
  return (
    <AnimatePresence>
      {user && (
        <>
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150]" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={onClose} />
          <motion.aside key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 z-[160] w-80 flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(180deg,#0D1225 0%,#090D1E 100%)", borderLeft: "1px solid rgba(255,255,255,0.08)", boxShadow: "-24px 0 80px rgba(0,0,0,0.6)" }}
            onClick={e => e.stopPropagation()}>

            {/* top accent */}
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${roleColor}70, transparent)` }} />
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{ background: `radial-gradient(circle at 100% 0%, ${roleColor}12 0%, transparent 65%)` }} />

            {/* header */}
            <div className="relative p-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <button onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.7)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(148,163,184,0.7)"; }}>
                <X size={14} />
              </button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar name={user.name} avatar={user.avatar} size={56} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ background: user.isActive !== false ? "#4ADE80" : "#FBBF24", borderColor: "#0D1225" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(100,116,139,0.8)" }}>{user.email}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <RoleBadge role={user.role} />
                    <PlanBadge plan={user.plan} />
                  </div>
                </div>
              </div>
            </div>

            {/* info grid */}
            <div className="grid grid-cols-2 gap-2.5 p-5">
              {[
                { icon: Calendar, label: "Joined",   value: new Date(user.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}), color: "#635BFF" },
                { icon: Activity, label: "Status",   value: user.isActive !== false ? "Active" : "Suspended", color: user.isActive !== false ? "#4ADE80" : "#FBBF24" },
                { icon: Mail,     label: "Provider", value: user.provider || "local",  color: "#38BDF8" },
                { icon: Zap,      label: "Verified", value: user.isEmailVerified ? "Yes" : "No", color: user.isEmailVerified ? "#4ADE80" : "#F87171" },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <m.icon size={10} style={{ color: m.color }} />
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(100,116,139,0.6)" }}>{m.label}</p>
                  </div>
                  <p className="text-[12px] font-bold" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* actions */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(100,116,139,0.45)" }}>Actions</p>
              {[
                { icon: Shield, label: user.role === "admin" ? "Remove Admin Role" : "Grant Admin Role", fn: () => { onRoleToggle(); onClose(); }, color: "#A78BFA" },
                { icon: user.isActive !== false ? Ban : CheckCircle, label: user.isActive !== false ? "Suspend User" : "Activate User", fn: () => { onToggleActive(); onClose(); }, color: user.isActive !== false ? "#FBBF24" : "#4ADE80" },
              ].map(a => (
                <motion.button key={a.label} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                  onClick={a.fn}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-left transition-all"
                  style={{ background: `${a.color}0d`, border: `1px solid ${a.color}22`, color: a.color }}
                  onMouseEnter={e => e.currentTarget.style.background = `${a.color}1a`}
                  onMouseLeave={e => e.currentTarget.style.background = `${a.color}0d`}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${a.color}18` }}>
                    <a.icon size={13} />
                  </span>
                  {a.label}
                </motion.button>
              ))}

              {/* plan switcher */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: "rgba(255,255,255,0.03)", color: "rgba(100,116,139,0.55)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  Change Plan
                </p>
                <div className="flex">
                  {["free","pro","premium"].map((p, i) => (
                    <button key={p} onClick={() => { onPlanChange(p); onClose(); }}
                      className="flex-1 py-2.5 text-[11px] font-bold capitalize transition-all"
                      style={{
                        background: user.plan === p ? "rgba(99,91,255,0.2)" : "transparent",
                        color: user.plan === p ? "#A78BFA" : "rgba(148,163,184,0.55)",
                        borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}
                      onMouseEnter={e => { if (user.plan !== p) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { if (user.plan !== p) e.currentTarget.style.background = "transparent"; }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                onClick={() => { onDelete(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-left transition-all"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#F87171" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)" }}>
                  <Trash2 size={13} style={{ color: "#F87171" }} />
                </span>
                Delete User
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Confirm Dialog ────────────────────────────────────────────────────────
const ConfirmDialog = ({ state, onClose }) => (
  <AnimatePresence>
    {state.open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
        <motion.div initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="w-full max-w-sm rounded-2xl p-6"
          style={{ background: "linear-gradient(145deg,#0D1225,#090D1E)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Trash2 size={20} style={{ color: "#F87171" }} />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Confirm Action</h3>
          <p className="text-sm mb-6" style={{ color: "rgba(148,163,184,0.8)" }}>{state.message}</p>
          <div className="flex gap-3">
            <button onClick={() => onClose(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(203,213,225,0.8)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>Cancel</button>
            <button onClick={() => onClose(true)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", boxShadow: "0 0 20px rgba(239,68,68,0.3)" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 32px rgba(239,68,68,0.5)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(239,68,68,0.3)"}>Confirm</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── CSV export ────────────────────────────────────────────────────────────
const exportCSV = users => {
  const rows = [["Name","Email","Role","Plan","Status","Joined"],
    ...users.map(u => [u.name, u.email, u.role, u.plan,
      u.isActive !== false ? "Active" : "Suspended",
      new Date(u.createdAt).toLocaleDateString()])];
  const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "users.csv" });
  a.click(); URL.revokeObjectURL(a.href);
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const AdminUsers = () => {
  const { users, total, stats, fetchUsers, fetchStats, updateUser, deleteUser, isLoading } = useAdminStore();
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [sortBy, setSortBy]         = useState("createdAt");
  const [sortDir, setSortDir]       = useState("desc");
  const [selected, setSelected]     = useState(new Set());
  const [focused, setFocused]       = useState(false);
  const [drawer, setDrawer]         = useState(null);
  const { confirm, confirmState, handleClose } = useConfirm();

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    fetchUsers({ search, page, limit: LIMIT, role: roleFilter, plan: planFilter, sort: sortBy, dir: sortDir });
    setSelected(new Set());
  }, [search, page, roleFilter, planFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = search || roleFilter || planFilter;

  const handleRoleToggle   = u => updateUser(u._id, { role: u.role === "admin" ? "freelancer" : "admin" });
  const handleToggleActive = async u => {
    const ok = await confirm(`${u.isActive !== false ? "Suspend" : "Activate"} "${u.name}"?`);
    if (ok) updateUser(u._id, { isActive: u.isActive === false });
  };
  const handlePlanChange   = (u, plan) => updateUser(u._id, { plan });
  const handleDelete       = async u => {
    const ok = await confirm(`Permanently delete "${u.name}"? This cannot be undone.`);
    if (ok) deleteUser(u._id);
  };
  const handleBulkDelete   = async () => {
    const ok = await confirm(`Delete ${selected.size} selected users? This cannot be undone.`);
    if (ok) { for (const id of selected) await deleteUser(id); setSelected(new Set()); }
  };

  const toggleSelect    = id => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll       = () => selected.size === users.length ? setSelected(new Set()) : setSelected(new Set(users.map(u => u._id)));
  const handleSort      = col => { if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortBy(col); setSortDir("asc"); } };

  const kpis = [
    { icon: Users,     label: "Total Users",  value: stats?.totalUsers,  color: "#635BFF", sub: `+${stats?.newUsers ?? 0} this month`, delay: 0    },
    { icon: UserCheck, label: "Active (30d)", value: stats?.activeToday, color: "#10B981", sub: "Unique logins",                       delay: 0.07 },
    { icon: UserCog,   label: "Admins",       value: stats?.adminCount,  color: "#A78BFA", sub: "Platform admins",                    delay: 0.14 },
    { icon: Crown,     label: "Paid Users",   value: stats?.paidUsers,   color: "#FBBF24", sub: "Pro + Premium",                      delay: 0.21 },
  ];

  const SortTh = ({ label, col, w }) => (
    <th onClick={col ? () => handleSort(col) : undefined}
      className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] select-none"
      style={{ color: "rgba(100,116,139,0.6)", cursor: col ? "pointer" : "default", width: w }}>
      <span className="flex items-center gap-1.5">
        {label}
        {col && <ArrowUpDown size={10} style={{ color: sortBy === col ? "#A78BFA" : "rgba(100,116,139,0.35)" }} />}
      </span>
    </th>
  );

  return (
    <div className="min-h-screen relative"
      style={{ background: `${NOISE}, radial-gradient(ellipse 100% 50% at 60% -5%, rgba(99,91,255,0.09) 0%, transparent 50%), linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)` }}>

      {/* glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/3 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.055) 0%,transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(56,189,248,0.03) 0%,transparent 65%)" }} />
      </div>

      <ConfirmDialog state={confirmState} onClose={handleClose} />
      <UserDrawer user={drawer} onClose={() => setDrawer(null)}
        onRoleToggle={() => handleRoleToggle(drawer)}
        onToggleActive={() => handleToggleActive(drawer)}
        onPlanChange={p => handlePlanChange(drawer, p)}
        onDelete={() => handleDelete(drawer)} />

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-start justify-between gap-5 mb-8">
          <div>
            <h1 className="text-[30px] font-black tracking-tight leading-tight pb-1"
              style={{ background: "linear-gradient(135deg,#FFFFFF 25%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Users Management
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "rgba(100,116,139,0.7)" }}>
              Manage and control your platform users ·{" "}
              <span className="font-bold" style={{ color: "#A78BFA" }}>{total}</span> total
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* search */}
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                style={{ color: focused ? "#A78BFA" : "rgba(100,116,139,0.5)" }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                placeholder="Search name or email…"
                className="pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                style={{
                  width: 230,
                  background: focused ? "rgba(99,91,255,0.1)" : "rgba(255,255,255,0.05)",
                  border: focused ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.09)",
                  color: "#F1F5F9",
                  boxShadow: focused ? "0 0 0 3px rgba(99,91,255,0.12)" : "none",
                }} />
            </div>

            <FilterDrop label="Role" value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }}
              options={[{value:"admin",label:"Admin"},{value:"freelancer",label:"Freelancer"},{value:"client",label:"Client"}]} />
            <FilterDrop label="Plan" value={planFilter} onChange={v => { setPlanFilter(v); setPage(1); }}
              options={[{value:"free",label:"Free"},{value:"pro",label:"Pro"},{value:"premium",label:"Premium"}]} />

            <AnimatePresence>
              {hasFilters && (
                <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => { setSearch(""); setRoleFilter(""); setPlanFilter(""); setPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", color: "#F87171" }}>
                  <X size={11} />Clear
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.35 }}
              onClick={() => fetchUsers({ search, page, limit: LIMIT, role: roleFilter, plan: planFilter })}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.7)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.7)"; }}>
              <RefreshCw size={14} />
            </motion.button>

            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => exportCSV(users)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.75)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.75)"; }}>
              <Download size={13} />Export CSV
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {kpis.map(k => <KPICard key={k.label} {...k} />)}
        </div>

        {/* ── Bulk Bar ── */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="flex items-center gap-3 mb-4 px-5 py-3.5 rounded-2xl"
              style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.25)", backdropFilter: "blur(12px)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black text-white"
                style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)" }}>{selected.size}</div>
              <span className="text-[13px] font-semibold" style={{ color: "#A78BFA" }}>users selected</span>
              <div className="flex items-center gap-2 ml-auto">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#F87171" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.22)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}>
                  <Trash2 size={12} />Delete selected
                </motion.button>
                <button onClick={() => setSelected(new Set())}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.6)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(148,163,184,0.6)"}>
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.16,1,0.3,1] }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 60px rgba(99,91,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)" }}>

          {/* top glow line */}
          <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.4),rgba(167,139,250,0.3),transparent)" }} />

          {/* desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-5 py-4 w-12">
                    <input type="checkbox" checked={selected.size === users.length && users.length > 0}
                      onChange={toggleAll} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                  </th>
                  <SortTh label="User"   col="name"      />
                  <SortTh label="Role"   col={null}      w={120} />
                  <SortTh label="Plan"   col={null}      w={100} />
                  <SortTh label="Status" col={null}      w={120} />
                  <SortTh label="Joined" col="createdAt" w={140} />
                  <th className="px-5 py-4 w-14" />
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        {[12, 200, 90, 70, 90, 100, 32].map((w, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3.5 rounded-lg animate-pulse" style={{ width: w, background: "rgba(255,255,255,0.06)" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : users.length === 0
                  ? (
                    <tr><td colSpan={7}>
                      <div className="flex flex-col items-center py-24 text-center">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                          style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.15)" }}>
                          <Users size={32} style={{ color: "rgba(99,91,255,0.45)" }} />
                        </div>
                        <p className="text-[15px] font-bold text-white mb-2">No users found</p>
                        <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.55)" }}>
                          {hasFilters ? "Try adjusting your search or filters" : "Your platform will grow soon"}
                        </p>
                      </div>
                    </td></tr>
                  )
                  : users.map((user, i) => (
                    <motion.tr key={user._id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16,1,0.3,1] }}
                      className="group cursor-pointer transition-all duration-150"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onClick={() => setDrawer(user)}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(user._id)} onChange={() => toggleSelect(user._id)}
                          className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <motion.div whileHover={{ scale: 1.12 }} transition={{ duration: 0.18 }}>
                            <Avatar name={user.name} avatar={user.avatar} size={38} />
                          </motion.div>
                          <div>
                            <p className="text-[13px] font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors duration-150">{user.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "rgba(100,116,139,0.7)" }}>{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                      <td className="px-5 py-4"><PlanBadge plan={user.plan} /></td>
                      <td className="px-5 py-4"><StatusBadge active={user.isActive} /></td>

                      <td className="px-5 py-4 text-[12px]" style={{ color: "rgba(100,116,139,0.65)" }}>
                        {new Date(user.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                      </td>

                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <ActionMenu user={user}
                          onView={() => setDrawer(user)}
                          onRoleToggle={() => handleRoleToggle(user)}
                          onToggleActive={() => handleToggleActive(user)}
                          onPlanChange={p => handlePlanChange(user, p)}
                          onDelete={() => handleDelete(user)} />
                      </td>
                    </motion.tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* mobile */}
          <div className="md:hidden">
            {users.map((user, i) => (
              <motion.div key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 cursor-pointer transition-all"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                onClick={() => setDrawer(user)}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar name={user.name} avatar={user.avatar} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] truncate mb-2" style={{ color: "rgba(100,116,139,0.7)" }}>{user.email}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleBadge role={user.role} />
                    <PlanBadge plan={user.plan} />
                    <StatusBadge active={user.isActive} />
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "rgba(100,116,139,0.35)" }} />
              </motion.div>
            ))}
          </div>

          {/* pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              <p className="text-[12px]" style={{ color: "rgba(100,116,139,0.6)" }}>
                Showing{" "}
                <span className="font-bold text-white">{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)}</span>
                {" "}of{" "}
                <span className="font-bold text-white">{total}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: page===1 ? "rgba(100,116,139,0.25)" : "rgba(148,163,184,0.8)", cursor: page===1 ? "not-allowed" : "pointer" }}>
                  <ChevronLeft size={14} />
                </motion.button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i+1 : Math.max(1, Math.min(page-2, totalPages-4))+i;
                  return (
                    <motion.button key={p} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition-all"
                      style={{
                        background: p===page ? "linear-gradient(135deg,#635BFF,#8B5CF6)" : "rgba(255,255,255,0.05)",
                        border: p===page ? "1px solid rgba(99,91,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        color: p===page ? "#fff" : "rgba(148,163,184,0.75)",
                        boxShadow: p===page ? "0 0 16px rgba(99,91,255,0.4)" : "none",
                      }}>
                      {p}
                    </motion.button>
                  );
                })}
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: page===totalPages ? "rgba(100,116,139,0.25)" : "rgba(148,163,184,0.8)", cursor: page===totalPages ? "not-allowed" : "pointer" }}>
                  <ChevronRight size={14} />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminUsers;
