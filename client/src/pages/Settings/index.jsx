import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Palette, CreditCard, LogOut, Check, Zap } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import useBillingStore from "../../store/billingStore";
import api from "../../services/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";
import { getInitials, capitalize, formatDate } from "../../utils/helpers";
import { PLANS } from "../../utils/planConstants";

const TABS = [
  { id: "profile",       label: "Profile",      icon: User },
  { id: "security",      label: "Security",     icon: Lock },
  { id: "billing",       label: "Billing",      icon: CreditCard },
  { id: "appearance",    label: "Appearance",   icon: Palette },
  { id: "notifications", label: "Notifications",icon: Bell },
];

// ── Billing tab ───────────────────────────────────────────
const PLAN_FEATURES = {
  free:    ["3 projects", "5 clients", "10 invoices", "20 AI requests/mo", "Kanban board"],
  pro:     ["25 projects", "50 clients", "100 invoices", "200 AI requests/mo", "Analytics", "Priority support"],
  premium: ["Unlimited everything", "AI assistant", "Advanced analytics", "Custom domain", "Priority support"],
};

const PlanCard = ({ planKey, planInfo, currentPlan, onUpgrade, loading }) => {
  const isActive  = currentPlan === planKey;
  const isFree    = planKey === "free";
  const isPremium = planKey === "premium";

  return (
    <div className={`relative rounded-xl border-2 p-5 transition-all ${
      isActive
        ? "border-brand bg-brand-50 dark:bg-brand/10"
        : isPremium
          ? "border-slate-200 dark:border-dark-border bg-gradient-to-br from-slate-900 to-slate-800 text-white"
          : "border-surface-border dark:border-dark-border bg-white dark:bg-dark-card"
    }`}>
      {isPremium && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-brand rounded-full text-white text-xs font-semibold">
          Most Popular
        </div>
      )}
      {isActive && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
          <Check size={11} className="text-white" />
        </div>
      )}

      <div className="mb-3">
        <p className={`text-sm font-semibold ${isPremium ? "text-slate-300" : "text-ink-secondary dark:text-slate-400"}`}>
          {planInfo.name}
        </p>
        <div className="flex items-baseline gap-1 mt-1">
          {isFree ? (
            <span className={`text-2xl font-bold ${isPremium ? "text-white" : "text-ink dark:text-slate-100"}`}>Free</span>
          ) : (
            <>
              <span className={`text-2xl font-bold ${isPremium ? "text-white" : "text-ink dark:text-slate-100"}`}>
                ₹{planInfo.price.toLocaleString()}
              </span>
              <span className={`text-sm ${isPremium ? "text-slate-400" : "text-ink-muted"}`}>/mo</span>
            </>
          )}
        </div>
      </div>

      <ul className="space-y-1.5 mb-4">
        {(PLAN_FEATURES[planKey] || []).map((f) => (
          <li key={f} className={`flex items-center gap-2 text-xs ${isPremium ? "text-slate-300" : "text-ink-secondary dark:text-slate-400"}`}>
            <Check size={11} className={isPremium ? "text-brand-300" : "text-success"} />
            {f}
          </li>
        ))}
      </ul>

      {!isActive && !isFree && (
        <Button
          size="sm"
          className="w-full"
          variant={isPremium ? "cyan" : "primary"}
          loading={loading === planKey}
          onClick={() => onUpgrade(planKey)}
        >
          <Zap size={13} /> Upgrade to {planInfo.name}
        </Button>
      )}
      {isActive && !isFree && (
        <p className="text-xs text-brand font-medium text-center">Current plan</p>
      )}
    </div>
  );
};

const BillingTab = ({ user }) => {
  const { info, isLoading, fetchInfo, subscribe, cancelSubscription } = useBillingStore();
  const [upgrading, setUpgrading] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [params] = useSearchParams();
  useEffect(() => {
    fetchInfo();
    if (params.get("success") === "1") toast.success("Subscription activated!");
  }, []);

  const handleUpgrade = async (planKey) => {
    setUpgrading(planKey);
    try {
      await subscribe(planKey, { name: user?.name, email: user?.email });
      fetchInfo();
    } catch {
      // error handled in store
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      fetchInfo();
    } finally {
      setCancelling(false);
    }
  };

  const { PLANS: planList } = { PLANS };

  return (
    <div className="space-y-6">
      {/* Current status */}
      {info && (
        <div className="card">
          <h2 className="text-base font-semibold text-ink dark:text-slate-100 mb-3">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-secondary">
                You are on the <span className="font-semibold text-brand capitalize">{info.plan}</span> plan.
              </p>
              {info.subscription?.currentPeriodEnd && (
                <p className="text-xs text-ink-muted mt-0.5">
                  {info.subscription.cancelAtPeriodEnd
                    ? `Cancels on ${formatDate(info.subscription.currentPeriodEnd)}`
                    : `Renews on ${formatDate(info.subscription.currentPeriodEnd)}`}
                </p>
              )}
            </div>
            {info.plan !== "free" && !info.subscription?.cancelAtPeriodEnd && (
              <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel}>
                Cancel plan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-base font-semibold text-ink dark:text-slate-100 mb-4">Choose a plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(PLANS).map(([key, plan]) => (
            <PlanCard
              key={key}
              planKey={key}
              planInfo={plan}
              currentPlan={info?.plan || user?.plan || "free"}
              onUpgrade={handleUpgrade}
              loading={upgrading}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        Payments are processed securely via Razorpay. Prices in INR. Cancel anytime.
      </p>
    </div>
  );
};

// ── Main Settings page ────────────────────────────────────
const Settings = () => {
  const { user, setUser, logoutAll } = useAuthStore();
  const { isDark, toggle }           = useThemeStore();
  const navigate                     = useNavigate();
  const [params]                     = useSearchParams();

  const [tab, setTab]           = useState(params.get("tab") || "profile");
  const [profile, setProfile]   = useState({ name: user?.name || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving]     = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/users/profile", profile);
      setUser(data.data.user);
      toast.success("Profile updated");
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      await api.patch("/users/change-password", passwords);
      toast.success("Password changed");
      setPasswords({ currentPassword: "", newPassword: "" });
    } finally { setChangingPw(false); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100">Settings</h1>
        <p className="text-sm text-ink-secondary mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-300"
                  : "text-ink-secondary hover:bg-surface-secondary dark:hover:bg-dark-muted dark:text-slate-400"
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

            {tab === "profile" && (
              <div className="card space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-ink dark:text-slate-100 mb-4">Profile Information</h2>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-xl font-bold">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <p className="font-medium text-ink dark:text-slate-200">{user?.name}</p>
                      <p className="text-sm text-ink-secondary">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-brand capitalize">{user?.role}</span>
                        <span className="badge-neutral capitalize">{user?.plan || "free"} plan</span>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <Input label="Full name" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} required />
                    <Input label="Email" value={user?.email || ""} disabled hint="Email cannot be changed" />
                    <Button type="submit" loading={saving}>Save changes</Button>
                  </form>
                </div>
              </div>
            )}

            {tab === "security" && (
              <div className="card space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-ink dark:text-slate-100 mb-4">Change Password</h2>
                  {user?.provider !== "local" ? (
                    <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand/10 border border-brand/20 text-sm text-brand">
                      You signed in with {capitalize(user?.provider)}. Password management is handled by your OAuth provider.
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                      <Input label="Current password" type="password" value={passwords.currentPassword}
                        onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} required />
                      <Input label="New password" type="password" placeholder="Min. 8 characters"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                        required minLength={8} />
                      <Button type="submit" loading={changingPw}>Update password</Button>
                    </form>
                  )}
                </div>
                <div className="border-t border-surface-border dark:border-dark-border pt-6">
                  <h2 className="text-base font-semibold text-ink dark:text-slate-100 mb-1">Sessions</h2>
                  <p className="text-sm text-ink-secondary mb-4">Sign out from all devices including this one.</p>
                  <Button variant="danger" size="sm" onClick={async () => { await logoutAll(); navigate("/login"); }}>
                    <LogOut size={14} /> Sign out all devices
                  </Button>
                </div>
              </div>
            )}

            {tab === "billing" && <BillingTab user={user} />}

            {tab === "appearance" && (
              <div className="card">
                <h2 className="text-base font-semibold text-ink dark:text-slate-100 mb-4">Appearance</h2>
                <div className="flex items-center justify-between py-3 border-b border-surface-border dark:border-dark-border">
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-slate-200">Dark mode</p>
                    <p className="text-xs text-ink-muted">Switch between light and dark theme</p>
                  </div>
                  <button onClick={toggle}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isDark ? "bg-brand" : "bg-slate-200"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isDark ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </div>
            )}

            {tab === "notifications" && (
              <div className="card">
                <h2 className="text-base font-semibold text-ink dark:text-slate-100 mb-4">Notifications</h2>
                {["Project updates", "Task assignments", "Invoice reminders", "Weekly digest"].map((item) => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-surface-border dark:border-dark-border last:border-0">
                    <p className="text-sm text-ink dark:text-slate-200">{item}</p>
                    <button className="relative w-11 h-6 rounded-full bg-brand">
                      <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
