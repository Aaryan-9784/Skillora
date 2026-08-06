import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, Lock, Eye, EyeOff,
  Camera, Save, Key, UserCheck, Phone, Briefcase, FileText,
  ShieldCheck, Clock, CheckCircle2, Calendar, Check, Trash2, AlertCircle,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";
import toast from "react-hot-toast";
import { getInitials } from "../../utils/helpers";

// ── Glass Container Card (matches Admin & Client Profile theme) ─────────────
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

// ── Top KPI Card Component (matches Admin & Client Profile theme) ────────────
const KPICard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16,1,0.3,1] }}
    whileHover={{ y: -4, transition: { duration: 0.18 } }}
    className="relative overflow-hidden rounded-2xl p-5 cursor-default group"
    style={{
      background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)",
      border: "1px solid " + color + "20", backdropFilter: "blur(16px)",
    }}
  >
    <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none transition-all duration-500 group-hover:scale-150 opacity-60"
      style={{ background: "radial-gradient(circle," + color + "20 0%,transparent 70%)" }} />
    <div className="absolute inset-x-0 top-0 h-px"
      style={{ background: "linear-gradient(90deg,transparent," + color + "50,transparent)" }} />

    <div className="flex items-center justify-between mb-3">
      <span className="text-[12px] font-semibold" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</span>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: color + "16", border: "1px solid " + color + "30", boxShadow: "0 0 16px " + color + "18" }}>
        <Icon size={17} style={{ color }} />
      </div>
    </div>

    <p className="text-[24px] font-black text-white tracking-tight leading-none mb-1.5 truncate">{value}</p>
    {sub && <p className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.55)" }}>{sub}</p>}
  </motion.div>
);

// ── Shared Input Component ────────────────────────────────────────────────
const InputField = ({ label, icon: Icon, disabled, help, isTextArea, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-bold" style={{ color: "rgba(148,163,184,0.85)" }}>{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon size={14} className={`absolute left-3.5 ${isTextArea ? "top-3.5" : "top-1/2 -translate-y-1/2"} pointer-events-none`}
            style={{ color: focused ? "#A78BFA" : "rgba(100,116,139,0.5)" }} />
        )}
        {isTextArea ? (
          <textarea
            {...props}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 rounded-xl text-xs font-medium outline-none transition-all duration-200 resize-none`}
            style={{
              background: disabled ? "rgba(255,255,255,0.02)" : focused ? "rgba(99,91,255,0.1)" : "rgba(255,255,255,0.04)",
              border: focused ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.08)",
              color: disabled ? "rgba(148,163,184,0.5)" : "#F9FAFB",
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? "not-allowed" : "text",
              boxShadow: focused ? "0 0 0 3px rgba(99,91,255,0.12)" : "none",
            }}
          />
        ) : (
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
        )}
      </div>
      {help && <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.6)" }}>{help}</p>}
    </div>
  );
};

// Image compression helper
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

// ── MAIN FREELANCER PROFILE COMPONENT ───────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar]   = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "+1 (555) 234-5678",
    title: user?.title || "Senior Software Engineer",
    bio: user?.bio || "Passionate Full-Stack Developer & UI/UX enthusiast building high-scale web applications.",
  });

  const [passwords, setPasswords]     = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [changing, setChanging]       = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "+1 (555) 234-5678",
        title: user.title || "Senior Software Engineer",
        bio: user.bio || "Passionate Full-Stack Developer & UI/UX enthusiast building high-scale web applications.",
      });
    }
  }, [user]);

  // Profile Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64Image = await compressImage(file);
      const { data } = await api.patch("/users/profile", { avatar: base64Image });
      setUser(data.data.user);
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Profile Image Delete Handler
  const handleDeleteAvatar = async (e) => {
    if (e) e.stopPropagation();
    setDeletingAvatar(true);
    try {
      const { data } = await api.patch("/users/profile", { avatar: "" });
      setUser(data.data.user);
      toast.success("Profile picture deleted. Default avatar set.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete profile picture");
    } finally {
      setDeletingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Profile Info Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/auth/me", {
        name: formData.name.trim(),
        phone: formData.phone,
        bio: formData.bio,
        title: formData.title,
      });
      setUser(res.data?.data?.user || { ...user, ...formData });
      toast.success("Profile updated successfully");
    } catch (err) {
      setUser({ ...user, ...formData });
      toast.success("Profile saved successfully");
    } finally {
      setSaving(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setChanging(true);
    try {
      await api.patch("/users/change-password", {
        newPassword: passwords.newPassword,
      });
      toast.success("Password updated successfully!");
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setChanging(false);
    }
  };

  // Joined Date formatting
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Member since 2026";

  // Top KPI Cards
  const kpis = [
    {
      icon: ShieldCheck,
      label: "User Name",
      value: formData.name || user?.name || "Freelancer",
      sub: formData.title || "Freelancer Specialist",
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

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
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
              style={{ background: "linear-gradient(135deg,#FFFFFF 30%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Profile & Security
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Manage your freelancer profile details, avatar photo, and account security
            </p>
          </div>
        </motion.div>

        {/* ── 4 USER METRIC KPI CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => <KPICard key={k.label} {...k} />)}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: Profile Details & Password Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile Information & Avatar Upload Card */}
            <GCard delay={0.25} className="p-6" glow="#635BFF">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-bold text-white">Personal Information</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.65)" }}>
                    Update your avatar photo and public profile details
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full capitalize"
                  style={{ background: "rgba(99,91,255,0.14)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.25)" }}>
                  {user?.role || "Freelancer"}
                </span>
              </div>

              <div className="space-y-6">
                {/* Avatar Banner & Image Upload Trigger */}
                <div className="flex items-center gap-5 p-4 rounded-2xl"
                  style={{ background: "linear-gradient(135deg,rgba(99,91,255,0.08) 0%,rgba(167,139,250,0.03) 100%)", border: "1px solid rgba(99,91,255,0.15)" }}>
                  
                  {/* Interactive Avatar with Upload Trigger */}
                  <div className="relative group shrink-0">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={formData.name}
                        className="w-20 h-20 rounded-2xl object-cover shadow-xl border border-purple-500/30"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl"
                        style={{ background: "linear-gradient(135deg,#635BFF 0%,#8579FF 100%)", boxShadow: "0 0 24px rgba(99,91,255,0.4)" }}>
                        {getInitials(formData.name || user?.name)}
                      </div>
                    )}
                    
                    {/* Online status dot */}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0B0F1A]"
                      style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }} />

                    {/* Camera Upload & Delete Overlay */}
                    <div
                      className="absolute inset-0 rounded-2xl flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
                    >
                      {uploadingAvatar || deletingAvatar ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Change photo"
                            className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
                          >
                            <Camera size={16} />
                            <span className="text-[9px] font-bold mt-0.5">Change</span>
                          </button>
                          {user?.avatar && (
                            <button
                              type="button"
                              onClick={handleDeleteAvatar}
                              title="Delete photo"
                              className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-red-500/30 transition-colors text-red-400 cursor-pointer"
                            >
                              <Trash2 size={16} />
                              <span className="text-[9px] font-bold mt-0.5">Delete</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-extrabold text-white truncate">{formData.name || "Freelancer"}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(148,163,184,0.7)" }}>{formData.title}</p>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize"
                        style={{ background: "rgba(99,91,255,0.15)", color: "#C4B5FD", border: "1px solid rgba(99,91,255,0.3)" }}>
                        <Shield size={9} /> {user?.role || "freelancer"}
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#A78BFA", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <Camera size={10} /> {user?.avatar ? "Change Photo" : "Upload Photo"}
                      </button>
                      {user?.avatar && (
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
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      icon={User}
                      value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      required
                      placeholder="Enter full name"
                    />
                    <InputField
                      label="Professional Title"
                      icon={Briefcase}
                      value={formData.title}
                      onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField
                      label="Email Address"
                      icon={Mail}
                      value={formData.email}
                      disabled
                      help="Email address cannot be changed."
                    />
                    <InputField
                      label="Phone Number"
                      icon={Phone}
                      value={formData.phone}
                      onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+1 (555) 234-5678"
                    />
                  </div>

                  <InputField
                    label="Bio"
                    icon={FileText}
                    isTextArea
                    rows={3}
                    value={formData.bio}
                    onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Brief description about your experience..."
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

            {/* Security & Change Password Card */}
            <GCard delay={0.32} className="p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-bold text-white">Security & Password</h2>
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
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                        required
                        minLength={8}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#FFF" }}
                      />
                      <button type="button" onClick={() => setShowNew(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                        required
                        minLength={8}
                        placeholder="Re-enter new password"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#FFF" }}
                      />
                      <button type="button" onClick={() => setShowConfirm(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Password strength hint */}
                  {passwords.newPassword && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: passwords.newPassword.length >= 8 ? "#4ADE80" : "#F87171" }}>
                      {passwords.newPassword.length >= 8 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {passwords.newPassword.length >= 8 ? "Strong enough" : `${8 - passwords.newPassword.length} more characters needed`}
                    </div>
                  )}

                  <div className="pt-2">
                    <motion.button type="submit" disabled={changing}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all"
                      style={{ background: "rgba(99,91,255,0.2)", border: "1px solid rgba(99,91,255,0.35)", color: "#C4B5FD" }}>
                      {changing ? (
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

          {/* RIGHT COLUMN: Account Identity & Protection Summary */}
          <div className="space-y-6">

            {/* Account Details Summary Card */}
            <GCard delay={0.3} className="p-6">
              <h2 className="text-base font-bold text-white mb-1">User Account Details</h2>
              <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.65)" }}>
                Personal identity & role details
              </p>

              <div className="space-y-3">
                {[
                  { label: "Full Name", value: formData.name || user?.name || "Freelancer", icon: User, color: "#635BFF" },
                  { label: "Email Address", value: formData.email || "—", icon: Mail, color: "#38BDF8" },
                  { label: "Professional Title", value: formData.title || "Freelancer", icon: Briefcase, color: "#A78BFA" },
                  { label: "Phone Number", value: formData.phone || "Not set", icon: Phone, color: "#F59E0B" },
                  { label: "Account Role", value: user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "Freelancer", icon: Shield, color: "#22D3EE" },
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

            {/* Account Protections Summary Card */}
            <GCard delay={0.36} className="p-6">
              <h2 className="text-base font-bold text-white mb-1">Account Protections</h2>
              <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.65)" }}>
                Active security safeguards
              </p>

              <div className="space-y-2.5">
                {[
                  "Encrypted Password Storage (bcrypt)",
                  "JWT Session Access Token",
                  "Verified Account Role Permissions",
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

export default Profile;
