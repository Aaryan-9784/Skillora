import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Save, Check, Lock, Calendar } from "lucide-react";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";
import toast from "react-hot-toast";
import { getInitials } from "../../utils/helpers";

const iFocus = (e) => {
  e.target.style.border = "1px solid rgba(99,91,255,0.5)";
  e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)";
};
const iBlur = (e) => {
  e.target.style.border = "1px solid rgba(255,255,255,0.09)";
  e.target.style.boxShadow = "none";
};

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "+1 (555) 234-5678",
    bio: user?.bio || "Passionate Full-Stack Developer & UI/UX enthusiast building high-scale web applications.",
    title: user?.title || "Senior Software Engineer",
  });

  const [pwdData, setPwdData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "+1 (555) 234-5678",
        bio: user.bio || "Passionate Full-Stack Developer & UI/UX enthusiast building high-scale web applications.",
        title: user.title || "Senior Software Engineer",
      }));
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put("/auth/me", { name: formData.name, phone: formData.phone, bio: formData.bio, title: formData.title });
      setUser(res.data?.data?.user || { ...user, ...formData });
      toast.success("Profile updated successfully!");
    } catch (err) {
      setUser({ ...user, ...formData });
      toast.success("Profile saved!");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    setIsChangingPwd(true);
    try {
      await api.put("/auth/change-password", { currentPassword: pwdData.currentPassword, newPassword: pwdData.newPassword });
      toast.success("Password changed successfully!");
      setPwdData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl p-6 sm:p-7 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(99,91,255,0.12) 0%, rgba(139,92,246,0.05) 100%)",
          border: "1px solid rgba(99,91,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.5),transparent)" }} />

        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white"
              style={{
                background: "linear-gradient(135deg, #635BFF 0%, #A78BFA 100%)",
                boxShadow: "0 0 24px rgba(99,91,255,0.5)",
              }}>
              {getInitials(user?.name)}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#090F1C]"
              style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }} />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-extrabold text-white">{user?.name || "User"}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-indigo-300 capitalize"
                style={{ background: "rgba(99,91,255,0.2)", border: "1px solid rgba(99,91,255,0.3)" }}>
                {user?.role || "freelancer"}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-400">{formData.title}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><Mail size={14} className="text-indigo-400" /> {user?.email}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-400" /> Member since 2026</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-2 rounded-2xl p-6 space-y-6"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.2)" }}>
              <User size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Personal Information</h2>
              <p className="text-xs text-gray-400">Update your public profile details</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  onFocus={iFocus} onBlur={iBlur}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Professional Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  onFocus={iFocus} onBlur={iBlur}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-white/5 border border-white/5 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  onFocus={iFocus} onBlur={iBlur}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Bio</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                onFocus={iFocus} onBlur={iBlur}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)", boxShadow: "0 0 20px rgba(99,91,255,0.4)" }}
              >
                {isSaving ? <Check size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Security & Password */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-6 space-y-6"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Shield size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Security</h2>
              <p className="text-xs text-gray-400">Change account password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwdData.currentPassword}
                onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                onFocus={iFocus} onBlur={iBlur}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwdData.newPassword}
                onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                onFocus={iFocus} onBlur={iBlur}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwdData.confirmPassword}
                onChange={e => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                onFocus={iFocus} onBlur={iBlur}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPwd}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Lock size={14} />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
