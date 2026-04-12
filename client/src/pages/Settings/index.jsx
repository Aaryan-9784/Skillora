import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Bell, Palette, CreditCard, LogOut,
  Check, Zap, Shield, Eye, EyeOff, Camera,
  Smartphone, Globe, ChevronRight, ArrowLeft,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import useBillingStore from "../../store/billingStore";
import api from "../../services/api";
import toast from "react-hot-toast";
import { getInitials, capitalize, formatDate } from "../../utils/helpers";
import { PLANS } from "../../utils/planConstants";

// ─────────────────────────────────────────────────────────
// SHARED FORM STYLES
// ─────────────────────────────────────────────────────────
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
};
const lStyle = { color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };
const iFocus = (e) => { e.target.style.border = "1px solid rgba(99,91,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)"; };
const iBlur  = (e) => { e.target.style.border = "1px solid rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; };

// ─────────────────────────────────────────────────────────
// SECTION CARD WRAPPER
// ─────────────────────────────────────────────────────────
const SectionCard = ({ title, description, children }) => (
  <div className="rounded-2xl overflow-hidden"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
    {(title || description) && (
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {title && <h2 className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>{title}</h2>}
        {description && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{description}</p>}
      </div>
    )}
    <div className="px-6 py-5">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────
// TOGGLE SWITCH
// ─────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, color = "#635BFF" }) => (
  <button
    onClick={onChange}
    className="relative shrink-0 transition-colors duration-200"
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      background: checked ? color : "rgba(255,255,255,0.1)",
      boxShadow: checked ? `0 0 10px ${color}50` : "none",
      flexShrink: 0,
    }}
  >
    <motion.span
      animate={{ x: checked ? 22 : 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      style={{
        position: "absolute",
        top: 2,
        left: 0,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#FFFFFF",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        display: "block",
      }}
    />
  </button>
);

// ─────────────────────────────────────────────────────────
// SETTING ROW
// ─────────────────────────────────────────────────────────
const SettingRow = ({ label, description, children, last }) => (
  <div className={`flex items-center justify-between py-4 ${!last ? "border-b" : ""}`}
    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
    <div>
      <p className="text-sm font-medium" style={{ color: "#E5E7EB" }}>{label}</p>
      {description && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{description}</p>}
    </div>
    <div className="ml-4 shrink-0">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────
// GRADIENT BUTTON
// ─────────────────────────────────────────────────────────
const GradientBtn = ({ children, onClick, loading, type = "button", variant = "primary", size = "md" }) => {
  const styles = {
    primary: { background: "linear-gradient(135deg,#635BFF,#8B5CF6)", shadow: "0 0 16px rgba(99,91,255,0.35)" },
    danger:  { background: "linear-gradient(135deg,#EF4444,#DC2626)", shadow: "0 0 12px rgba(239,68,68,0.3)" },
    ghost:   { background: "rgba(255,255,255,0.05)", shadow: "none", border: "1px solid rgba(255,255,255,0.08)" },
  };
  const s = styles[variant] || styles.primary;
  const pad = size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm";

  return (
    <motion.button type={type} onClick={onClick} disabled={loading}
      whileHover={{ scale: 1.03, boxShadow: s.shadow }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 ${pad} rounded-xl font-semibold text-white transition-all duration-150`}
      style={{ background: s.background, boxShadow: s.shadow, border: s.border || "1px solid rgba(255,255,255,0.12)" }}>
      {loading ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : children}
    </motion.button>
  );
};

// ─────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────
const ProfileTab = ({ user, setUser }) => {
  const [profile, setProfile] = useState({ name: user?.name || "" });
  const [saving, setSaving]   = useState(false);

  // Profile completion
  const fields = [user?.name, user?.email, user?.avatar];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/users/profile", profile);
      setUser(data.data.user);
      toast.success("Profile updated successfully");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Avatar + identity */}
      <SectionCard title="Profile Information" description="Your public identity on Skillora">
        <div className="flex items-start gap-5 mb-6">
          {/* Avatar */}
          <div className="relative shrink-0 group">
            <div className="w-18 h-18 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{
                width: 72, height: 72,
                background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
                boxShadow: "0 0 20px rgba(99,91,255,0.45)",
              }}>
              {getInitials(user?.name)}
            </div>
            <button className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <Camera size={16} className="text-white" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-bold" style={{ color: "#F9FAFB" }}>{user?.name}</p>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize"
                style={{ background: "rgba(99,91,255,0.15)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.25)" }}>
                {user?.role || "freelancer"}
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Zap size={9} className="inline mr-1" />
                {user?.plan || "free"} plan
              </span>
            </div>
          </div>
        </div>

        {/* Profile completion */}
        <div className="mb-5 p-3.5 rounded-xl" style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.15)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "#A78BFA" }}>Profile completion</p>
            <span className="text-xs font-bold" style={{ color: "#635BFF" }}>{completion}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #635BFF, #00D4FF)" }} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label style={lStyle}>Full name</label>
            <input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })}
              required style={iStyle} onFocus={iFocus} onBlur={iBlur} placeholder="Your full name" />
          </div>
          <div>
            <label style={lStyle}>Email address</label>
            <div className="relative">
              <input value={user?.email || ""} disabled
                style={{ ...iStyle, opacity: 0.5, cursor: "not-allowed", paddingRight: 40 }} />
              <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#4B5563" }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "#4B5563" }}>Email address cannot be changed</p>
          </div>
          <GradientBtn type="submit" loading={saving}>Save changes</GradientBtn>
        </form>
      </SectionCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// SECURITY TAB
// ─────────────────────────────────────────────────────────
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
      toast.success("Password updated successfully");
      setPasswords({ currentPassword: "", newPassword: "" });
    } finally { setChanging(false); }
  };

  return (
    <div className="space-y-5">
      {/* Password */}
      <SectionCard title="Password" description="Keep your account secure with a strong password">
        {user?.provider !== "local" ? (
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.2)" }}>
            <Shield size={16} style={{ color: "#635BFF", flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: "#A78BFA" }}>
              You signed in with <strong>{capitalize(user?.provider)}</strong>. Password management is handled by your OAuth provider.
            </p>
          </div>
        ) : (
          <form onSubmit={handleChange} className="space-y-4 max-w-sm">
            <div>
              <label style={lStyle}>Current password</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={passwords.currentPassword}
                  onChange={(e) => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
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
                  onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
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
            <GradientBtn type="submit" loading={changing}>Update password</GradientBtn>
          </form>
        )}
      </SectionCard>

      {/* Sessions */}
      <SectionCard title="Active Sessions" description="Manage devices where you're signed in">
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
        <GradientBtn variant="danger" onClick={onLogoutAll}>
          <LogOut size={13} /> Sign out all devices
        </GradientBtn>
      </SectionCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// BILLING TAB
// ─────────────────────────────────────────────────────────
const PLAN_FEATURES = {
  free:    ["3 projects", "5 clients", "10 invoices", "20 AI requests/mo", "Kanban board"],
  pro:     ["25 projects", "50 clients", "100 invoices", "200 AI requests/mo", "Analytics"],
  premium: ["Unlimited everything", "AI assistant", "Advanced analytics", "Custom domain", "Priority support"],
};

const BillingTab = ({ user }) => {
  const { info, fetchInfo, subscribe, cancelSubscription } = useBillingStore();
  const [upgrading, setUpgrading] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [params] = useSearchParams();

  useEffect(() => {
    fetchInfo();
    if (params.get("success") === "1") toast.success("Subscription activated!");
  }, []);

  const handleUpgrade = async (planKey) => {
    setUpgrading(planKey);
    try { await subscribe(planKey, { name: user?.name, email: user?.email }); fetchInfo(); }
    catch { } finally { setUpgrading(null); }
  };

  const currentPlan = info?.plan || user?.plan || "free";

  return (
    <div className="space-y-5">
      {/* Current plan status */}
      {info && (
        <SectionCard title="Current Plan" description="Your active subscription">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
                <Zap size={16} style={{ color: "#635BFF" }} />
              </div>
              <div>
                <p className="text-sm font-semibold capitalize" style={{ color: "#F9FAFB" }}>
                  {info.plan} Plan
                </p>
                {info.subscription?.currentPeriodEnd && (
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    {info.subscription.cancelAtPeriodEnd
                      ? `Cancels ${formatDate(info.subscription.currentPeriodEnd)}`
                      : `Renews ${formatDate(info.subscription.currentPeriodEnd)}`}
                  </p>
                )}
              </div>
            </div>
            {info.plan !== "free" && !info.subscription?.cancelAtPeriodEnd && (
              <GradientBtn variant="danger" size="sm" loading={cancelling}
                onClick={async () => { setCancelling(true); await cancelSubscription(); fetchInfo(); setCancelling(false); }}>
                Cancel
              </GradientBtn>
            )}
          </div>
        </SectionCard>
      )}

      {/* Plan cards */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#374151" }}>
          Available Plans
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isActive  = currentPlan === key;
            const isPremium = key === "premium";
            return (
              <motion.div key={key}
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                className="relative rounded-2xl p-4 overflow-hidden"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(99,91,255,0.18) 0%, rgba(139,92,246,0.1) 100%)"
                    : isPremium
                      ? "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(99,91,255,0.06) 100%)"
                      : "rgba(255,255,255,0.03)",
                  border: isActive
                    ? "1px solid rgba(99,91,255,0.4)"
                    : isPremium
                      ? "1px solid rgba(245,158,11,0.25)"
                      : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: isActive ? "0 0 0 1px rgba(99,91,255,0.2)" : "none",
                }}>
                {isPremium && (
                  <div className="absolute top-0 inset-x-0 h-px"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)" }} />
                )}
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#635BFF" }}>
                    <Check size={10} className="text-white" />
                  </div>
                )}

                <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>{plan.name}</p>
                <p className="text-xl font-bold mb-3" style={{ color: "#F9FAFB" }}>
                  {key === "free" ? "Free" : `₹${plan.price.toLocaleString()}`}
                  {key !== "free" && <span className="text-xs font-normal ml-1" style={{ color: "#6B7280" }}>/mo</span>}
                </p>

                <ul className="space-y-1.5 mb-4">
                  {(PLAN_FEATURES[key] || []).map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#9CA3AF" }}>
                      <Check size={10} style={{ color: isActive ? "#A78BFA" : "#635BFF", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isActive && key !== "free" && (
                  <GradientBtn size="sm" loading={upgrading === key} onClick={() => handleUpgrade(key)}>
                    <Zap size={11} /> Upgrade
                  </GradientBtn>
                )}
                {isActive && key !== "free" && (
                  <p className="text-[11px] font-semibold" style={{ color: "#A78BFA" }}>✓ Current plan</p>
                )}
              </motion.div>
            );
          })}
        </div>
        <p className="text-[11px] mt-3" style={{ color: "#374151" }}>
          Payments via Razorpay · Prices in INR · Cancel anytime
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// APPEARANCE TAB
// ─────────────────────────────────────────────────────────
const AppearanceTab = () => {
  const { isDark, toggle } = useThemeStore();
  const [density, setDensity] = useState("comfortable");

  return (
    <div className="space-y-5">
      <SectionCard title="Theme" description="Customize how Skillora looks">
        <SettingRow label="Dark mode" description="Switch between light and dark interface">
          <Toggle checked={isDark} onChange={toggle} />
        </SettingRow>
        <SettingRow label="System theme" description="Automatically match your OS preference" last>
          <Toggle checked={false} onChange={() => {}} color="#22C55E" />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Display" description="Adjust layout density">
        <div className="flex gap-2">
          {["compact", "comfortable", "spacious"].map((d) => (
            <button key={d} onClick={() => setDensity(d)}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium capitalize transition-all duration-150"
              style={{
                background: density === d ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.04)",
                border: density === d ? "1px solid rgba(99,91,255,0.35)" : "1px solid rgba(255,255,255,0.07)",
                color: density === d ? "#A78BFA" : "#6B7280",
              }}>
              {d}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// NOTIFICATIONS TAB
// ─────────────────────────────────────────────────────────
const NOTIF_ITEMS = [
  { id: "projects",  label: "Project updates",    desc: "When projects are created or updated",  default: true  },
  { id: "tasks",     label: "Task assignments",   desc: "When tasks are assigned to you",         default: true  },
  { id: "invoices",  label: "Invoice reminders",  desc: "Payment due and overdue alerts",         default: true  },
  { id: "digest",    label: "Weekly digest",      desc: "Summary of your week every Monday",      default: false },
  { id: "ai",        label: "AI suggestions",     desc: "Smart insights from Skillora AI",        default: true  },
];

const NotificationsTab = () => {
  const [prefs, setPrefs] = useState(
    Object.fromEntries(NOTIF_ITEMS.map(i => [i.id, i.default]))
  );

  return (
    <div className="space-y-5">
      <SectionCard title="Email Notifications" description="Choose what you want to be notified about">
        {NOTIF_ITEMS.map((item, i) => (
          <SettingRow key={item.id} label={item.label} description={item.desc} last={i === NOTIF_ITEMS.length - 1}>
            <Toggle checked={prefs[item.id]} onChange={() => setPrefs(p => ({ ...p, [item.id]: !p[item.id] }))} />
          </SettingRow>
        ))}
      </SectionCard>

      <SectionCard title="Push Notifications" description="Browser and mobile push alerts">
        <SettingRow label="Browser notifications" description="Get alerts in your browser" last>
          <GradientBtn size="sm" variant="ghost" onClick={() => toast.success("Notifications enabled")}>
            Enable
          </GradientBtn>
        </SettingRow>
      </SectionCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// SIDEBAR NAV
// ─────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",       label: "Profile",       icon: User,       desc: "Personal info" },
  { id: "security",      label: "Security",      icon: Shield,     desc: "Password & sessions" },
  { id: "billing",       label: "Billing",       icon: CreditCard, desc: "Plans & payments" },
  { id: "appearance",    label: "Appearance",    icon: Palette,    desc: "Theme & display" },
  { id: "notifications", label: "Notifications", icon: Bell,       desc: "Alerts & emails" },
];

const SettingsSidebar = ({ tab, onTabChange }) => (
  <nav className="w-52 shrink-0 space-y-0.5">
    {TABS.map(({ id, label, icon: Icon, desc }) => (
      <motion.button key={id} onClick={() => onTabChange(id)}
        whileTap={{ scale: 0.98 }}
        className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
        style={{
          background: tab === id ? "rgba(99,91,255,0.15)" : "transparent",
          border: tab === id ? "1px solid rgba(99,91,255,0.25)" : "1px solid transparent",
        }}
        onMouseEnter={e => { if (tab !== id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={e => { if (tab !== id) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Active indicator */}
        {tab === id && (
          <motion.div layoutId="settings-indicator"
            className="absolute left-0 inset-y-2 w-0.5 rounded-r-full"
            style={{ background: "linear-gradient(180deg, #635BFF, #A78BFA)", boxShadow: "0 0 8px rgba(99,91,255,0.7)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: tab === id ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.05)",
            border: tab === id ? "1px solid rgba(99,91,255,0.3)" : "1px solid rgba(255,255,255,0.07)",
          }}>
          <Icon size={14} style={{ color: tab === id ? "#A78BFA" : "#6B7280" }} strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: tab === id ? "#E5E7EB" : "#9CA3AF" }}>{label}</p>
        </div>

        {tab === id && <ChevronRight size={12} style={{ color: "#635BFF", flexShrink: 0 }} />}
      </motion.button>
    ))}
  </nav>
);

// ─────────────────────────────────────────────────────────
// MAIN SETTINGS PAGE
// ─────────────────────────────────────────────────────────
const Settings = () => {
  const { user, setUser, logoutAll } = useAuthStore();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "profile");

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate("/login");
  };

  const CONTENT = {
    profile:       <ProfileTab user={user} setUser={setUser} />,
    security:      <SecurityTab user={user} onLogoutAll={handleLogoutAll} />,
    billing:       <BillingTab user={user} />,
    appearance:    <AppearanceTab />,
    notifications: <NotificationsTab />,
  };

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(0,212,255,0.04) 0%, transparent 55%)",
      }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 mb-4 text-sm font-medium transition-all duration-150 group"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
            onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { e.style && (e.style.background = "rgba(99,91,255,0.15)"); }}
            >
              <ArrowLeft size={14} />
            </div>
            Back
          </motion.button>
          <h1 className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Layout */}
        <div className="flex gap-6 items-start">
          <SettingsSidebar tab={tab} onTabChange={setTab} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
                {CONTENT[tab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
