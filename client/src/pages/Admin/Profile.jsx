import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, Camera, Lock, Eye, EyeOff,
  Globe, LogOut, ArrowLeft, Zap, Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getInitials } from "../../utils/helpers";
import api from "../../services/api";
import toast from "react-hot-toast";

// ── Shared input styles ────────────────────────────────────────────────────
const iStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F9FAFB",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};
const lStyle = { color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };
const iFocus = (e) => { e.target.style.border = "1px solid rgba(99,91,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)"; };
const iBlur  = (e) => { e.target.style.border = "1px solid rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; };

// ── Card wrapper ───────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={"rounded-2xl overflow-hidden " + className}
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
    {children}
  </div>
);

const CardHeader = ({ title, description }) => (
  <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    <h3 className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>{title}</h3>
    {description && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{description}</p>}
  </div>
);

// ── Gradient button ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, loading, type = "button", variant = "primary", size = "md" }) => {
  const bg = {
    primary: "linear-gradient(135deg,#635BFF,#8B5CF6)",
    danger:  "linear-gradient(135deg,#EF4444,#DC2626)",
    ghost:   "rgba(255,255,255,0.05)",
  }[variant];
  const shadow = {
    primary: "0 0 16px rgba(99,91,255,0.35)",
    danger:  "0 0 12px rgba(239,68,68,0.3)",
    ghost:   "none",
  }[variant];
  const pad = size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm";

  return (
    <motion.button type={type} onClick={onClick} disabled={loading}
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 ${pad} rounded-xl font-semibold text-white transition-all duration-150`}
      style={{ background: bg, boxShadow: shadow, border: "1px solid rgba(255,255,255,0.1)" }}>
      {loading
        ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        : children}
    </motion.button>
  );
};

// ── TABS ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",  label: "Profile",  icon: User  },
  { id: "security", label: "Security", icon: Lock  },
];

// ── Profile tab ────────────────────────────────────────────────────────────
const ProfileTab = ({ user, setUser }) => {
  const [name, setName]   = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const fields = [user?.name, user?.email];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/users/profile", { name });
      setUser(data.data.user);
      toast.success("Profile updated");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Avatar + identity */}
      <Card>
        <CardHeader title="Profile Information" description="Your admin identity on Skillora" />
        <div className="px-6 py-5 space-y-5">

          {/* Avatar row */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0 group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{
                  background: "linear-gradient(135deg,#635BFF 0%,#A78BFA 100%)",
                  boxShadow: "0 0 28px rgba(99,91,255,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                {getInitials(user?.name)}
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{ background: "#22C55E", borderColor: "#080E1A", boxShadow: "0 0 10px rgba(34,197,94,0.8)" }} />
              <button className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: "rgba(0,0,0,0.55)" }}>
                <Camera size={16} className="text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold truncate" style={{ color: "#F9FAFB" }}>{user?.name}</p>
              <p className="text-sm mt-0.5 truncate" style={{ color: "#6B7280" }}>{user?.email}</p>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "linear-gradient(135deg,rgba(99,91,255,0.25),rgba(139,92,246,0.15))", color: "#C4B5FD", border: "1px solid rgba(99,91,255,0.35)" }}>
                  <Shield size={9} strokeWidth={2.5} /> Admin
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online
                </span>
              </div>
            </div>
          </div>

          {/* Completion bar */}
          <div className="p-3.5 rounded-xl" style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.15)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: "#A78BFA" }}>Profile completion</p>
              <span className="text-xs font-bold" style={{ color: "#635BFF" }}>{completion}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#635BFF,#00D4FF)" }} />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label style={lStyle}>Full name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                required style={iStyle} onFocus={iFocus} onBlur={iBlur} placeholder="Your full name" />
            </div>
            <div>
              <label style={lStyle}>Email address</label>
              <div className="relative">
                <input value={user?.email || ""} disabled
                  style={{ ...iStyle, opacity: 0.5, cursor: "not-allowed", paddingRight: 40 }} />
                <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#4B5563" }} />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "#4B5563" }}>Email cannot be changed</p>
            </div>
            <div>
              <label style={lStyle}>Role</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.2)" }}>
                <Shield size={13} style={{ color: "#635BFF" }} />
                <span className="text-sm font-semibold" style={{ color: "#A78BFA" }}>Administrator</span>
              </div>
            </div>
            <Btn type="submit" loading={saving}>
              <Save size={13} /> Save changes
            </Btn>
          </form>
        </div>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader title="Account Details" />
        <div className="px-6 py-5 space-y-3">
          {[
            { label: "Account type", value: "Admin", icon: Shield, color: "#A78BFA" },
            { label: "Email", value: user?.email, icon: Mail, color: "#6B7280" },
            { label: "Status", value: "Active", icon: Zap, color: "#22C55E" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span className="text-sm" style={{ color: "#9CA3AF" }}>{label}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: "#E5E7EB" }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Security tab ───────────────────────────────────────────────────────────
const SecurityTab = ({ user, onLogoutAll }) => {
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [changing, setChanging]       = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    setChanging(true);
    try {
      await api.patch("/users/change-password", passwords);
      toast.success("Password updated");
      setPasswords({ currentPassword: "", newPassword: "" });
    } finally { setChanging(false); }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Password" description="Keep your admin account secure" />
        <div className="px-6 py-5">
          {user?.provider !== "local" ? (
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.2)" }}>
              <Shield size={16} style={{ color: "#635BFF", flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: "#A78BFA" }}>
                You signed in with OAuth. Password management is handled by your provider.
              </p>
            </div>
          ) : (
            <form onSubmit={handleChange} className="space-y-4 max-w-sm">
              <div>
                <label style={lStyle}>Current password</label>
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={passwords.currentPassword}
                    onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                    required style={{ ...iStyle, paddingRight: 40 }} onFocus={iFocus} onBlur={iBlur} />
                  <button type="button" onClick={() => setShowCurrent(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#4B5563" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#9CA3AF"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={lStyle}>New password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={passwords.newPassword}
                    onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                    required minLength={8} placeholder="Min. 8 characters"
                    style={{ ...iStyle, paddingRight: 40 }} onFocus={iFocus} onBlur={iBlur} />
                  <button type="button" onClick={() => setShowNew(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#4B5563" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#9CA3AF"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <Btn type="submit" loading={changing}>Update password</Btn>
            </form>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Active Sessions" description="Manage devices where you're signed in" />
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl mb-4"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(34,197,94,0.15)" }}>
              <Globe size={14} style={{ color: "#22C55E" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "#E5E7EB" }}>Current session</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>This device · Active now</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>Active</span>
          </div>
          <Btn variant="danger" onClick={onLogoutAll}>
            <LogOut size={13} /> Sign out all devices
          </Btn>
        </div>
      </Card>
    </div>
  );
};

// ── Main Profile page ──────────────────────────────────────────────────────
const AdminProfile = () => {
  const { user, setUser, logoutAll } = useAuthStore();
  const navigate = useNavigate();

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 20% 0%,rgba(99,91,255,0.07) 0%,transparent 55%), radial-gradient(ellipse at 80% 100%,rgba(0,212,255,0.04) 0%,transparent 55%)",
      }}>
      <div className="max-w-2xl mx-auto">

        {/* Back button */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <motion.button onClick={() => navigate(-1)} whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-150"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
            onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ArrowLeft size={14} />
            </div>
            Back
          </motion.button>
        </motion.div>

        {/* All sections stacked */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: [0.16,1,0.3,1] }}
          className="space-y-5">
          <ProfileTab user={user} setUser={setUser} />
          <SecurityTab user={user} onLogoutAll={handleLogoutAll} />
        </motion.div>
      </div>
    </div>
  );
};

export default AdminProfile;
