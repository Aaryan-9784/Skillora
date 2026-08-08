import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Phone, Building2, MapPin, Camera, Trash2,
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Save, Shield, Mail, Key, UserCheck, ShieldCheck,
  Calendar, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import useClientPortalStore from "../../store/clientPortalStore";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { getInitials } from "../../utils/helpers";

// ── Glass Container Card (matches Admin Overview theme) ───────────────────
const GCard = ({ children, delay, className, glow }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16,1,0.3,1] }}
    className={"relative overflow-hidden rounded-2xl " + (className || "")}
    style={{
      background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: glow ? ("0 0 50px " + glow + "10") : "0 0 30px rgba(99,91,255,0.04)",
    }}
  >
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{ background: glow
        ? ("linear-gradient(90deg,transparent," + glow + "50,transparent)")
        : "linear-gradient(90deg,transparent,rgba(99,91,255,0.25),transparent)" }} />
    {children}
  </motion.div>
);



// ── Shared Input Component ────────────────────────────────────────────────
const InputField = ({ label, icon: Icon, disabled, help, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-bold" style={{ color: "rgba(148,163,184,0.85)" }}>{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: focused ? "#A78BFA" : "rgba(100,116,139,0.5)" }} />
        )}
        <input
          {...props}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 rounded-xl text-xs font-medium outline-none transition-all duration-200`}
          style={{
            background: disabled ? "rgba(255,255,255,0.02)" : focused ? "rgba(99,91,255,0.1)" : "rgba(255,255,255,0.04)",
            border: focused ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.08)",
            color: disabled ? "rgba(148,163,184,0.5)" : "#F9FAFB",
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : "text",
            boxShadow: focused ? "0 0 0 3px rgba(99,91,255,0.12)" : "none",
          }}
        />
      </div>
      {help && <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.6)" }}>{help}</p>}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────
const ClientProfile = () => {
  const { profile, loading, fetchProfile, updateProfile } = useClientPortalStore();
  const { user, setUser } = useAuthStore();

  const [form, setForm] = useState({ name: "", phone: "", company: "", address: "" });
  const [pwForm, setPwForm] = useState({ next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    try {
      await updateProfile(form);
    } finally {
      setSaving(false);
    }
  };

  // ── Image compression helper ───────────────────────────
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    });
  };

  // ── Avatar upload ─────────────────────────────────────
  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setAvatarLoading(true);
    try {
      const base64Image = await compressImage(file);
      const { data } = await api.patch("/client/profile", { avatar: base64Image });
      setAvatarUrl(data.data.client?.avatar || base64Image);
      // Sync auth store so header/sidebar update immediately
      if (data.data.user) setUser(data.data.user);
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };


  const handleDeleteAvatar = async (e) => {
    if (e) e.stopPropagation();
    setDeletingAvatar(true);
    try {
      const { data } = await api.patch("/client/profile", { avatar: "" });
      setAvatarUrl(null);
      // Sync auth store so header/sidebar update immediately
      if (data.data.user) setUser(data.data.user);
      toast.success("Profile image deleted. Default avatar set.");
    } catch {
      toast.error("Failed to delete avatar");
    } finally {
      setDeletingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── Change password ───────────────────────────────────
  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error("Passwords do not match"); return; }
    if (pwForm.next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPwLoading(true);
    try {
      await api.patch("/users/change-password", {
        newPassword: pwForm.next,
      });
      toast.success("Password changed successfully!");
      setPwForm({ next: "", confirm: "" });
    } catch {
      toast.error("Failed to update password");
    } finally {
      setPwLoading(false);
    }
  };

  // Joined Date formatting
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Member";

  // Top KPI Cards
  const kpis = [
    {
      icon: ShieldCheck,
      label: "User Name",
      value: form.name || user?.name || "Client",
      sub: "Client Account",
      color: "#635BFF",
      delay: 0,
    },
    {
      icon: UserCheck,
      label: "Account Status",
      value: "Active",
      sub: "Online session verified",
      color: "#10B981",
      delay: 0.07,
    },
    {
      icon: Key,
      label: "Authentication",
      value: user?.provider !== "local" ? "Google OAuth" : "Password Protected",
      sub: "JWT Auth Token",
      color: "#A78BFA",
      delay: 0.14,
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: joinedDate,
      sub: "Verified Account",
      color: "#00D4FF",
      delay: 0.21,
    },
  ];

  if (loading.profile && !profile) {
    return (
      <div className="min-h-screen relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
        <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-6 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="h-5 w-32 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-10 w-full rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="h-10 w-full rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileRef}
        onChange={handleAvatar}
        accept="image/*"
        className="hidden"
      />

      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.2))",
              }}>
              Profile & Security
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Manage your profile details, avatar photo, and account security
            </p>
          </div>
        </motion.div>

        {/* ── 4 USER METRIC KPI CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => <SubpageStatCard key={k.label} {...k} />)}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: Profile Details & Password Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile Information & Avatar Upload Card */}
            <GCard delay={0.25} className="p-6" glow="#635BFF">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-bold text-white">Profile Details</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.65)" }}>
                    Update your avatar photo and personal information
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Profile Completion Mini Ring */}
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg width="40" height="40" className="-rotate-90">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                      <motion.circle cx="20" cy="20" r="16" fill="none"
                        stroke={pct === 100 ? "#22C55E" : "#635BFF"} strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${2 * Math.PI * 16}` }}
                        animate={{ strokeDasharray: `${2 * Math.PI * 16 * (pct / 100)} ${2 * Math.PI * 16}` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold" style={{ color: pct === 100 ? "#4ADE80" : "#A78BFA" }}>
                      {pct}%
                    </span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: "rgba(0,212,255,0.14)", color: "#22D3EE", border: "1px solid rgba(0,212,255,0.25)" }}>
                    Client
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Avatar Banner & Image Upload Trigger */}
                <div className="flex items-center gap-5 p-4 rounded-2xl"
                  style={{ background: "linear-gradient(135deg,rgba(99,91,255,0.08) 0%,rgba(167,139,250,0.03) 100%)", border: "1px solid rgba(99,91,255,0.15)" }}>
                  
                  {/* Interactive Avatar with Upload Trigger */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={form.name}
                          className="w-20 h-20 rounded-2xl object-cover shadow-xl border border-purple-500/30"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl"
                          style={{ background: "linear-gradient(135deg,#635BFF 0%,#8579FF 100%)", boxShadow: "0 0 24px rgba(99,91,255,0.4)" }}
                        >
                          {getInitials(form.name || user?.name)}
                        </div>
                      )}

                      {/* Camera Upload & Delete Overlay */}
                      <div
                        className="absolute inset-0 rounded-2xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 overflow-hidden"
                        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
                      >
                        {avatarLoading || deletingAvatar ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => fileRef.current?.click()}
                              title="Change photo"
                              className="w-8 h-8 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-purple-400/30"
                            >
                              <Camera size={15} />
                            </button>
                            {avatarUrl && (
                              <button
                                type="button"
                                onClick={handleDeleteAvatar}
                                title="Delete photo"
                                className="w-8 h-8 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-rose-400/30"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Online status dot */}
                    <span
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0B0F1A] z-10"
                      style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-extrabold text-white truncate">{form.name || "Your Name"}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(148,163,184,0.7)" }}>{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: "rgba(0,212,255,0.15)", color: "#67E8F9", border: "1px solid rgba(0,212,255,0.3)" }}>
                        <Shield size={9} /> Client
                      </span>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#A78BFA", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <Camera size={10} /> {avatarUrl ? "Change Photo" : "Upload Photo"}
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          disabled={deletingAvatar}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer hover:bg-red-500/20"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                          <Trash2 size={10} /> Delete Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editable Profile Form */}
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      icon={User}
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                      placeholder="Enter full name"
                    />
                    <InputField
                      label="Phone"
                      icon={Phone}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 00000 00000"
                    />
                    <InputField
                      label="Company"
                      icon={Building2}
                      value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      placeholder="Your company name"
                    />
                    <InputField
                      label="Address"
                      icon={MapPin}
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="City, Country"
                    />
                  </div>

                  <InputField
                    label="Email Address"
                    icon={Mail}
                    value={user?.email || ""}
                    disabled
                    help="Email address cannot be changed."
                  />

                  <div className="pt-2">
                    <motion.button type="submit" disabled={saving}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all"
                      style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.3)" }}>
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={14} /> Save Profile Changes
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </GCard>

            {/* Change Password Card */}
            <GCard delay={0.32} className="p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-bold text-white">Change Password</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.65)" }}>
                    Update your security password for account login
                  </p>
                </div>
                <Lock size={18} className="text-purple-400" />
              </div>

              {user?.provider !== "local" ? (
                <div className="p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.2)" }}>
                  <Shield size={18} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">OAuth Single Sign-On Active</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.7)" }}>
                      Your account logs in via Google/GitHub OAuth. Password management is handled by your sign-in provider.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePassword} className="space-y-4 max-w-md">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw.next ? "text" : "password"}
                        value={pwForm.next}
                        onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                        required
                        minLength={8}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#FFF" }}
                      />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, next: !s.next }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
                        {showPw.next ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPw.confirm ? "text" : "password"}
                        value={pwForm.confirm}
                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        required
                        minLength={8}
                        placeholder="Re-enter new password"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#FFF" }}
                      />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
                        {showPw.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Password strength hint */}
                  {pwForm.next && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: pwForm.next.length >= 8 ? "#4ADE80" : "#F87171" }}>
                      {pwForm.next.length >= 8 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {pwForm.next.length >= 8 ? "Strong enough" : `${8 - pwForm.next.length} more characters needed`}
                    </div>
                  )}

                  <div className="pt-2">
                    <motion.button type="submit" disabled={pwLoading}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all"
                      style={{ background: "rgba(99,91,255,0.2)", border: "1px solid rgba(99,91,255,0.35)", color: "#C4B5FD" }}>
                      {pwLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Key size={14} /> Update Password
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
            </GCard>

          </div>

          {/* RIGHT COLUMN: Client Account Details Summary */}
          <div className="space-y-6">

            {/* Account Details Summary */}
            <GCard delay={0.3} className="p-6">
              <h2 className="text-base font-bold text-white mb-1">Account Details</h2>
              <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.65)" }}>
                Personal account identity details
              </p>

              <div className="space-y-3">
                {[
                  { label: "Full Name", value: form.name || user?.name || "Client", icon: User, color: "#635BFF" },
                  { label: "Email Address", value: user?.email || "—", icon: Mail, color: "#38BDF8" },
                  { label: "Phone", value: form.phone || "Not set", icon: Phone, color: "#F59E0B" },
                  { label: "Company", value: form.company || "Not set", icon: Building2, color: "#A78BFA" },
                  { label: "Address", value: form.address || "Not set", icon: MapPin, color: "#10B981" },
                  { label: "Account Role", value: "Client", icon: Shield, color: "#22D3EE" },
                  { label: "Account Status", value: "Verified Active", icon: CheckCircle2, color: "#4ADE80" },
                  { label: "Auth Provider", value: user?.provider || "Local Password", icon: Key, color: "#F59E0B" },
                  { label: "Joined Date", value: joinedDate, icon: Calendar, color: "#00D4FF" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="p-3 rounded-xl flex items-center justify-between"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: color + "15", border: "1px solid " + color + "25" }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-400 truncate">{label}</span>
                    </div>
                    <span className="text-xs font-bold text-white truncate ml-2">{value}</span>
                  </div>
                ))}
              </div>
            </GCard>


            {/* Account Security Summary */}
            <GCard delay={0.42} className="p-6">
              <h2 className="text-base font-bold text-white mb-1">Account Protections</h2>
              <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.65)" }}>
                Active security safeguards
              </p>

              <div className="space-y-2.5">
                {[
                  "Encrypted Password Storage (bcrypt)",
                  "JWT Session Access Token",
                  "Verified Client Permissions",
                  "Active SSL/TLS Encryption",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-medium" style={{ color: "rgba(148,163,184,0.85)" }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-300 shrink-0">
                      <Check size={10} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </GCard>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ClientProfile;
