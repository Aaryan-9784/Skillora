import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Eye, EyeOff, AlertCircle,
  Mail, Lock, ShieldCheck, Kanban, Brain, FileText, Users,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";
import {
  AuthInput, OAuthButtons, GlassCard, CTAButton, CursorGlow,
} from "./_authShared";

const Login = () => {
  const [role, setRole]     = useState("freelancer");
  const [form, setForm]     = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [mfaSession, setMfaSession] = useState(null); // { mfaToken }
  const [totpCode, setTotpCode]     = useState("");
  const [useBackup, setUseBackup]   = useState(false);

  const { login, verify2FALogin, isLoading, errors, clearErrors } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (params.get("session") === "expired") toast.error("Session expired. Please sign in again.");
    if (params.get("error"))                 toast.error("OAuth sign-in failed. Please try again.");
    return () => clearErrors?.();
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await login(form);
    if (res.require2FA) {
      setMfaSession({ mfaToken: res.mfaToken });
      toast("Two-factor authentication required.", { icon: "🔐" });
      return;
    }
    if (res.success) {
      if (res.role === "admin")       navigate("/admin");
      else if (res.role === "client") navigate("/client/dashboard");
      else                            navigate("/dashboard");
    }
  };

  const handle2FASubmit = async e => {
    e.preventDefault();
    if (!totpCode.trim()) return;
    const res = await verify2FALogin(mfaSession.mfaToken, totpCode.trim());
    if (res.success) {
      if (res.role === "admin")       navigate("/admin");
      else if (res.role === "client") navigate("/client/dashboard");
      else                            navigate("/dashboard");
    }
  };

  const apiBase   = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
  const canSubmit = form.email && form.password;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* ── video bg ── */}
      <video autoPlay muted loop playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-85"
        style={{ filter: "brightness(0.55) contrast(1.15) saturate(1.1) blur(0.3px)" }}>
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      {/* ── overlay stack: dark on left for text, lighter on right ── */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.15)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to right, rgba(4,7,18,0.88) 0%, rgba(4,7,18,0.7) 40%, rgba(4,7,18,0.2) 70%, rgba(4,7,18,0.05) 100%)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to top, rgba(4,7,18,0.35) 0%, transparent 40%)" }} />
      <div className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 85% at 20% 50%, rgba(4,7,18,0.75) 0%, transparent 85%)" }} />

      {/* animated mesh orbs */}
      <motion.div className="absolute rounded-full pointer-events-none z-[1]"
        animate={{ x: [0,50,0], y: [0,-30,0], scale: [1,1.12,1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 700, height: 700, top: "-20%", left: "-10%",
          background: "radial-gradient(circle,rgba(99,91,255,0.1) 0%,transparent 65%)" }} />
      <motion.div className="absolute rounded-full pointer-events-none z-[1]"
        animate={{ x: [0,-40,0], y: [0,50,0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        style={{ width: 500, height: 500, bottom: "-10%", right: "5%",
          background: "radial-gradient(circle,rgba(139,92,246,0.09) 0%,transparent 65%)" }} />

      {/* brand glow */}
      <div className="absolute inset-0 z-[3] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 60% at 85% 50%,rgba(99,91,255,0.12) 0%,transparent 70%)" }} />

      {/* cursor glow */}
      <CursorGlow />

      {/* floating particles */}
      {[
        { top: "22%", left: "70%", s: 2,   d: 0.4 },
        { top: "48%", left: "80%", s: 1.5, d: 1.5 },
        { top: "68%", left: "75%", s: 2,   d: 1.0 },
        { top: "32%", left: "88%", s: 1.5, d: 2.3 },
      ].map((p, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-[5]"
          style={{ top: p.top, left: p.left, width: p.s, height: p.s, background: "rgba(167,139,250,0.5)" }}
          animate={{ y: [0,-10,0], opacity: [0.1,0.45,0.1] }}
          transition={{ duration: 5.5 + i * 0.7, repeat: Infinity, delay: p.d, ease: "easeInOut" }} />
      ))}

      {/* ── layout ── */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_480px]">

        {/* LEFT — brand */}
        <div className="hidden lg:flex flex-col justify-between px-16 py-14 select-none">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <motion.span whileHover={{ filter: "drop-shadow(0 0 14px rgba(99,91,255,0.7))" }}
                transition={{ duration: 0.2 }}
                style={{ fontFamily: "'Sora','Inter',sans-serif", fontSize: 26, fontWeight: 800,
                  letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, cursor: "pointer", display: "block",
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                Skillora
              </motion.span>
            </Link>
          </motion.div>

            <div className="space-y-8 max-w-[460px]">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-[11px] font-extrabold tracking-[0.3em] uppercase"
              style={{ fontFamily: "'Sora', 'Inter', sans-serif", color: "#A78BFA", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
              Freelancer OS
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.16,1,0.3,1] }}
              className="space-y-5" style={{ cursor: "default" }}>
              <h1 className="font-extrabold leading-[1.1] text-white"
                style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontSize: "clamp(2.4rem,3.5vw,3.2rem)", letterSpacing: "-0.035em", textShadow: "0 4px 16px rgba(0,0,0,0.9)" }}>
                Welcome back.<br />
                Let's get you{" "}
                <span style={{
                  background: "linear-gradient(135deg,#A78BFA 0%,#818CF8 50%,#38BDF8 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 25px rgba(167,139,250,0.55))",
                }}>back to work.</span>
              </h1>
              <p className="text-[15px] leading-[1.7] font-medium"
                style={{ color: "#94A3B8", maxWidth: "36ch", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
                Continue managing your clients, projects, and growth — all in one place.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-8" style={{ cursor: "default" }}>
              {[{ value: "10K+", label: "Freelancers" },{ value: "₹2M+", label: "Revenue tracked" },{ value: "50K+", label: "Invoices sent" }].map(s => (
                <div key={s.label}>
                  <p className="text-[20px] font-extrabold text-white" style={{ fontFamily: "'Sora', 'Inter', sans-serif", letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{s.value}</p>
                  <p className="text-[12px] font-medium" style={{ color: "#94A3B8", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.p
            className="text-[11px] font-medium"
            style={{ color: "#94A3B8", textShadow: "0 1px 6px rgba(0,0,0,0.8)", cursor: "default" }}
            whileHover={{ color: "rgba(203,213,225,0.9)", y: -1 }}
            transition={{ duration: 0.2 }}>
            © 2025 Skillora. All rights reserved.
          </motion.p>
        </div>

        {/* RIGHT — form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-10 lg:py-0">
          <motion.div initial={{ opacity: 0, x: 28, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16,1,0.3,1] }}
            className="w-full max-w-[420px]">

            {/* mobile logo */}
            <div className="mb-8 lg:hidden">
              <Link to="/" style={{ textDecoration: "none" }}>
                <span style={{ fontFamily: "'Sora','Inter',sans-serif", fontSize: 26, fontWeight: 800,
                  letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, cursor: "pointer" }}>
                  Skillora
                </span>
              </Link>
            </div>

            <GlassCard>
              {mfaSession ? (
                <div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.3)" }}>
                      <ShieldCheck size={22} style={{ color: "#A78BFA" }} />
                    </div>
                    <h2 className="font-extrabold text-white mb-1.5"
                      style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontSize: "1.5rem", letterSpacing: "-0.03em" }}>
                      Two-Factor Authentication 🔐
                    </h2>
                    <p className="text-[13px] font-medium leading-relaxed" style={{ color: "#94A3B8" }}>
                      {useBackup
                        ? "Enter one of your 8-character single-use backup codes."
                        : "Open your authenticator app (Google Authenticator, Authy, 1Password) and enter the 6-digit code."}
                    </p>
                  </motion.div>

                  <AnimatePresence>
                    {errors?.general && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="flex items-start gap-2.5 p-3.5 mb-5 rounded-2xl"
                        style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <AlertCircle size={13} style={{ color: "#F87171", flexShrink: 0, marginTop: 1 }} />
                        <p className="text-[13px]" style={{ color: "rgba(252,165,165,0.9)" }}>{errors.general}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handle2FASubmit} className="space-y-4">
                    <AuthInput
                      label={useBackup ? "Backup Code" : "6-Digit Authenticator Code"}
                      icon={Lock}
                      type="text"
                      name="totpCode"
                      placeholder={useBackup ? "A1B2C3D4" : "123456"}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      required
                      autoFocus
                    />

                    <CTAButton disabled={!totpCode.trim()} isLoading={isLoading}>
                      {isLoading
                        ? <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Verifying…</>
                        : <>Verify & Continue <ArrowRight size={15} strokeWidth={2.5} /></>
                      }
                    </CTAButton>

                    <div className="pt-2 flex flex-col gap-2 items-center text-[12px]">
                      <button
                        type="button"
                        onClick={() => { setUseBackup(!useBackup); setTotpCode(""); }}
                        className="font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        {useBackup ? "← Use Authenticator App" : "Use a backup code instead"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMfaSession(null); setTotpCode(""); }}
                        className="text-slate-400 hover:text-slate-200 transition-colors mt-1 cursor-pointer"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {/* header */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }} className="mb-7">
                    <h2 className="font-extrabold text-white mb-1.5"
                      style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontSize: "1.75rem", letterSpacing: "-0.03em",
                        background: "linear-gradient(135deg,#FFFFFF 30%,#C4B5FD 70%,#818CF8 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Welcome back
                    </h2>
                    <p className="text-[13px] font-medium" style={{ color: "#94A3B8" }}>Sign in to continue</p>
                  </motion.div>

                  {/* error */}
                  <AnimatePresence>
                    {errors?.general && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="flex items-start gap-2.5 p-3.5 mb-5 rounded-2xl"
                        style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <AlertCircle size={13} style={{ color: "#F87171", flexShrink: 0, marginTop: 1 }} />
                        <p className="text-[13px]" style={{ color: "rgba(252,165,165,0.9)" }}>{errors.general}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                      <AuthInput label="Email" icon={Mail} type="email" name="email"
                        placeholder="you@example.com" value={form.email} onChange={handleChange}
                        error={errors?.email} required autoComplete="email" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36 }}>
                      <AuthInput label="Password" icon={Lock}
                        type={showPw ? "text" : "password"} name="password"
                        placeholder="••••••••" value={form.password} onChange={handleChange}
                        error={errors?.password} required autoComplete="current-password"
                        labelRight={
                          <Link to="/forgot-password" className="text-[12px] font-semibold transition-colors duration-200"
                            style={{ fontFamily: "'Sora', 'Inter', sans-serif", color: "#A78BFA" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#C4B5FD"}
                            onMouseLeave={e => e.currentTarget.style.color = "#A78BFA"}>
                            Forgot password?
                          </Link>
                        }
                        suffix={
                          <motion.button type="button" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setShowPw(s => !s)}
                            style={{ color: "#94A3B8", transition: "color 0.25s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
                            onMouseLeave={e => e.currentTarget.style.color = "#94A3B8"}>
                            {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                          </motion.button>
                        }
                      />
                    </motion.div>

                    {/* CTA */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
                      <CTAButton disabled={!canSubmit} isLoading={isLoading}>
                        {isLoading
                          ? <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Signing in…</>
                          : <>Sign in <ArrowRight size={15} strokeWidth={2.5} /></>
                        }
                      </CTAButton>
                    </motion.div>

                    {/* OAuth — below CTA */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}>
                      <OAuthButtons apiBase={apiBase} role={role} />
                    </motion.div>
                  </form>
                </>
              )}
            </GlassCard>

              {/* trust */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="mt-5 flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} style={{ color: "#4ADE80" }} />
                <span className="text-[11px] font-medium" style={{ color: "#94A3B8" }}>Secure login · End-to-end encrypted</span>
              </motion.div>

              <p className="mt-4 text-center text-[13px] font-medium" style={{ color: "#94A3B8" }}>
                Don't have an account?{" "}
                <Link to="/register" className="font-bold hover:underline"
                  style={{ fontFamily: "'Sora', 'Inter', sans-serif", color: "#A78BFA" }}>
                  Sign up free
                </Link>
              </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
