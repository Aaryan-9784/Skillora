import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Phone, Building2, MapPin, Camera,
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Save, Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import useClientPortalStore from "../../store/clientPortalStore";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";
import { getInitials } from "../../utils/helpers";

// ── Field component ───────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>
      <Icon size={12} /> {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#F9FAFB",
};

// ── Profile completion ring ───────────────────────────────
const CompletionRing = ({ pct }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <motion.circle cx="32" cy="32" r={r} fill="none"
          stroke={pct === 100 ? "#22C55E" : "#635BFF"} strokeWidth="4"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color: pct === 100 ? "#4ADE80" : "#A78BFA" }}>
        {pct}%
      </span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────
const ClientProfile = () => {
  const { profile, loading, fetchProfile, updateProfile } = useClientPortalStore();
  const { user } = useAuthStore();

  const [form, setForm] = useState({ name: "", phone: "", company: "", address: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setForm({
        name:    profile.name    || "",
        phone:   profile.phone   || "",
        company: profile.company || "",
        address: profile.address || "",
      });
      setAvatarUrl(profile.avatar || null);
    }
  }, [profile]);

  // ── Profile completion ────────────────────────────────
  const fields = ["name", "phone", "company", "address"];
  const filled  = fields.filter((f) => form[f]?.trim()).length;
  const pct     = Math.round((filled / fields.length) * 100);

  // ── Save profile ──────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile(form);
  };

  // ── Avatar upload ─────────────────────────────────────
  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size is 5MB"); return; }

    const fd = new FormData();
    fd.append("avatar", file);
    setAvatarLoading(true);
    try {
      const { data } = await api.post("/upload/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(data.data.url);
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Change password ───────────────────────────────────
  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error("Passwords do not match"); return; }
    if (pwForm.next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPwLoading(true);
    try {
      await api.patch("/user/change-password", {
        currentPassword: pwForm.current,
        newPassword:     pwForm.next,
      });
      toast.success("Password changed");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch {
      // error toast handled by api interceptor
    } finally {
      setPwLoading(false);
    }
  };

  if (loading.profile && !profile) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl p-6 space-y-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">

      {/* ── Profile card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
            <User size={13} style={{ color: "#A78BFA" }} />
          </div>
          <h2 className="text-sm font-semibold text-white">Profile Information</h2>
          <div className="ml-auto flex items-center gap-3">
            <CompletionRing pct={pct} />
            <div>
              <p className="text-xs font-semibold text-white">Profile {pct === 100 ? "Complete" : "Completion"}</p>
              <p className="text-[11px]" style={{ color: "#6B7280" }}>
                {pct === 100 ? "All fields filled" : `${fields.length - filled} field${fields.length - filled !== 1 ? "s" : ""} remaining`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-xl font-bold text-white"
                style={{ background: avatarUrl ? "transparent" : "linear-gradient(135deg,#635BFF,#A78BFA)", boxShadow: "0 0 24px rgba(99,91,255,0.35)" }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : getInitials(form.name || user?.name)
                }
              </div>
              <button onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 12px rgba(99,91,255,0.5)" }}>
                {avatarLoading
                  ? <svg className="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <Camera size={12} className="text-white" />
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>
            <div>
              <p className="text-base font-bold text-white">{form.name || "Your Name"}</p>
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{user?.email}</p>
              <p className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: "rgba(0,212,255,0.12)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}>
                Client
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" icon={User}>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"}
                  onBlur={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"}
                />
              </Field>
              <Field label="Phone" icon={Phone}>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 00000 00000"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"}
                  onBlur={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"}
                />
              </Field>
              <Field label="Company" icon={Building2}>
                <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Your company name"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"}
                  onBlur={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"}
                />
              </Field>
              <Field label="Address" icon={MapPin}>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="City, Country"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"}
                  onBlur={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"}
                />
              </Field>
            </div>

            <div className="flex justify-end pt-2">
              <motion.button whileTap={{ scale: 0.97 }} type="submit"
                disabled={loading.profile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg,#635BFF 0%,#8B5CF6 100%)",
                  boxShadow: "0 0 20px rgba(99,91,255,0.35)",
                  opacity: loading.profile ? 0.7 : 1,
                }}>
                {loading.profile
                  ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <Save size={14} />
                }
                Save Changes
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* ── Change password ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

        <div className="flex items-center gap-3 px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Shield size={13} style={{ color: "#F87171" }} />
          </div>
          <h2 className="text-sm font-semibold text-white">Change Password</h2>
        </div>

        <form onSubmit={handlePassword} className="p-6 space-y-4">
          {[
            { key: "current", label: "Current Password",  placeholder: "Enter current password" },
            { key: "next",    label: "New Password",       placeholder: "Min. 8 characters" },
            { key: "confirm", label: "Confirm Password",   placeholder: "Repeat new password" },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label} icon={Lock}>
              <div className="relative">
                <input
                  type={showPw[key] ? "text" : "password"}
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"}
                  onBlur={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"}
                />
                <button type="button" onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#9CA3AF"}
                  onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}>
                  {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
          ))}

          {/* Password strength hint */}
          {pwForm.next && (
            <div className="flex items-center gap-2 text-xs" style={{ color: pwForm.next.length >= 8 ? "#4ADE80" : "#F87171" }}>
              {pwForm.next.length >= 8 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {pwForm.next.length >= 8 ? "Strong enough" : `${8 - pwForm.next.length} more characters needed`}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <motion.button whileTap={{ scale: 0.97 }} type="submit"
              disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg,#EF4444,#DC2626)",
                boxShadow: "0 0 16px rgba(239,68,68,0.25)",
                opacity: (pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm) ? 0.5 : 1,
              }}>
              {pwLoading
                ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                : <Lock size={14} />
              }
              Update Password
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientProfile;
