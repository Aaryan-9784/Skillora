import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, Lock, Eye, EyeOff,
  Camera, Save, Key, UserCheck, Phone, Briefcase, FileText,
  ShieldCheck, Clock, CheckCircle2, Calendar, Check, Trash2, AlertCircle,
  QrCode, Copy, Download, Smartphone,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
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
  const { user, setUser, setup2FA, enable2FA, disable2FA } = useAuthStore();
  const fileInputRef = useRef(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar]   = useState(false);

  // 2FA state
  const [show2FAModal, setShow2FAModal]         = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [setupData, setSetupData]               = useState(null);
  const [totpInput, setTotpInput]               = useState("");
  const [backupCodes, setBackupCodes]           = useState(null);
  const [loading2FA, setLoading2FA]             = useState(false);

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

  const handleInitiate2FA = async () => {
    setLoading2FA(true);
    try {
      const data = await setup2FA();
      setSetupData(data);
      setTotpInput("");
      setBackupCodes(null);
      setShow2FAModal(true);
    } catch (err) {
      // toast in store
    } finally {
      setLoading2FA(false);
    }
  };

  const handleConfirmEnable2FA = async (e) => {
    e.preventDefault();
    if (!totpInput.trim()) return;
    setLoading2FA(true);
    try {
      const data = await enable2FA(totpInput.trim());
      setBackupCodes(data.backupCodes);
      toast.success("2FA activated successfully!");
    } catch (err) {
      // error in store
    } finally {
      setLoading2FA(false);
    }
  };

  const handleConfirmDisable2FA = async (e) => {
    e.preventDefault();
    if (!totpInput.trim()) return;
    setLoading2FA(true);
    try {
      await disable2FA(totpInput.trim());
      setShowDisableModal(false);
      setTotpInput("");
    } catch (err) {
      // error in store
    } finally {
      setLoading2FA(false);
    }
  };

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
      const { data } = await api.patch("/users/profile", {
        name: formData.name.trim(),
        phone: formData.phone,
        bio: formData.bio,
        title: formData.title,
      });
      setUser(data.data.user);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
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
              style={{
                background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.2))",
              }}>
              Profile & Security
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Manage your freelancer profile details, avatar photo, and account security
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
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={formData.name}
                          className="w-20 h-20 rounded-2xl object-cover shadow-xl border border-purple-500/30"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl"
                          style={{ background: "linear-gradient(135deg,#635BFF 0%,#8579FF 100%)", boxShadow: "0 0 24px rgba(99,91,255,0.4)" }}
                        >
                          {getInitials(formData.name || user?.name)}
                        </div>
                      )}

                      {/* Camera Upload & Delete Overlay */}
                      <div
                        className="absolute inset-0 rounded-2xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 overflow-hidden"
                        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
                      >
                        {uploadingAvatar || deletingAvatar ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              title="Change photo"
                              className="w-8 h-8 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-purple-400/30"
                            >
                              <Camera size={15} />
                            </button>
                            {user?.avatar && (
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

            {/* Two-Factor Authentication Card */}
            <GCard delay={0.4} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: user?.isTwoFactorEnabled ? "rgba(16,185,129,0.15)" : "rgba(99,91,255,0.15)",
                      border: user?.isTwoFactorEnabled ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(99,91,255,0.3)",
                    }}>
                    <Smartphone size={20} style={{ color: user?.isTwoFactorEnabled ? "#10B981" : "#A78BFA" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">2FA Authenticator</h2>
                    <p className="text-xs text-slate-400">TOTP (Google, Authy, 1Password)</p>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  user?.isTwoFactorEnabled
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                }`}>
                  {user?.isTwoFactorEnabled ? "Active" : "Disabled"}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300 my-4">
                Require a 6-digit passcode from your authenticator app each time you sign in to protect your account.
              </p>

              {user?.isTwoFactorEnabled ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl flex items-center gap-2 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                    <span>Two-Factor Authentication is active on your account.</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setTotpInput(""); setShowDisableModal(true); }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    Disable 2FA
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleInitiate2FA}
                  disabled={loading2FA}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading2FA ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <QrCode size={15} /> Enable 2FA Authenticator App
                    </>
                  )}
                </motion.button>
              )}
            </GCard>

          </div>

        </div>

      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title="Set Up Two-Factor Authentication"
        description="Scan the QR code with Google Authenticator, Authy, or 1Password"
        icon={Smartphone}
        size="md"
      >
        {backupCodes ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              <p className="font-bold text-sm mb-1 text-emerald-400">🎉 Two-Factor Authentication Enabled!</p>
              <p>Save these 10 single-use backup codes in a safe place. You can use them to access your account if you lose your phone or authenticator app.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl bg-slate-900/80 border border-white/10 font-mono text-center text-sm text-purple-300 select-all">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-black/40 border border-white/5">{code}</div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join("\n"));
                  toast.success("Backup codes copied to clipboard!");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Copy size={14} /> Copy All
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([`Skillora 2FA Backup Codes:\n\n${backupCodes.join("\n")}`], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "skillora-2fa-backup-codes.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Backup codes downloaded!");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download size={14} /> Download (.txt)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShow2FAModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step 1: QR code display */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              {setupData?.qrCodeUrl ? (
                <img
                  src={setupData.qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-xl p-2 bg-white shadow-xl"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-slate-800 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

              <p className="text-xs text-slate-400 mt-4 max-w-xs">
                Scan this QR code using <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong>.
              </p>

              {setupData?.secret && (
                <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-purple-300 select-all">
                  <span>Secret: <strong>{setupData.secret}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret);
                      toast.success("Secret copied to clipboard!");
                    }}
                    className="text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Verification code input */}
            <form onSubmit={handleConfirmEnable2FA} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Enter 6-Digit Passcode from Authenticator App
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-center font-mono text-lg tracking-widest bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-400 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!totpInput.trim() || loading2FA}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading2FA ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify & Activate 2FA"
                )}
              </button>
            </form>
          </div>
        )}
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        title="Disable Two-Factor Authentication"
        description="Confirm disabling 2FA on your account"
        icon={Smartphone}
        size="sm"
      >
        <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter your current 6-digit authenticator passcode to confirm disabling 2FA.
          </p>

          <input
            type="text"
            placeholder="123456"
            maxLength={6}
            value={totpInput}
            onChange={(e) => setTotpInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-center font-mono text-lg tracking-widest bg-white/5 border border-white/10 text-white outline-none focus:border-red-400 transition-all"
            required
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDisableModal(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!totpInput.trim() || loading2FA}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading2FA ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Disable 2FA"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
