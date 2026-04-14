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
  AuthInput, OAuthButtons, RoleToggle, GlassCard, CTAButton, CursorGlow,
} from "./_authShared";

const Login = () => {
  const [role, setRole]     = useState("freelancer");
  const [form, setForm]     = useState({ email: "", password: "", rememberMe: false });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading, errors, clearErrors } = useAuthStore();
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
    const { success, role: userRole } = await login(form);
    if (success) {
      if (userRole === "admin")       navigate("/admin");
      else if (userRole === "client") navigate("/client/dashboard");
      else                            navigate("/dashboard");
    }
  };

  const apiBase   = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
  const canSubmit = form.email && form.password;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* ── video bg ── */}
      <video autoPlay muted loop playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-80"
        style={{ filter: "blur(0.5px)" }}>
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      {/* ── overlay stack ── */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.12)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to right,rgba(4,7,18,0.0) 0%,rgba(4,7,18,0.1) 42%,rgba(4,7,18,0.45) 68%,rgba(4,7,18,0.6) 100%)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to top,rgba(4,7,18,0.3) 0%,transparent 40%)" }} />

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
                  letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, cursor: "pointer", display: "block" }}>
                Skillora
              </motion.span>
            </Link>
          </motion.div>

          <div className="space-y-8 max-w-[460px]">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-[10px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "rgba(129,140,248,0.65)" }}>
              Freelancer OS
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.16,1,0.3,1] }}
              className="space-y-5" style={{ cursor: "default" }}>
              <h1 className="font-bold leading-[1.1] text-white"
                style={{ fontSize: "clamp(2.2rem,3.2vw,3rem)", letterSpacing: "-0.03em" }}>
                Welcome back.<br />
                Let's get you{" "}
                <span style={{
                  background: "linear-gradient(135deg,#818CF8 0%,#C4B5FD 40%,#38BDF8 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(129,140,248,0.4))",
                }}>back to work.</span>
              </h1>
              <p className="text-[14px] leading-[1.75]"
                style={{ color: "rgba(148,163,184,0.62)", maxWidth: "36ch" }}>
                Continue managing your clients, projects, and growth — all in one place.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-8" style={{ cursor: "default" }}>
              {[{ value: "10K+", label: "Freelancers" },{ value: "₹2M+", label: "Revenue tracked" },{ value: "50K+", label: "Invoices sent" }].map(s => (
                <div key={s.label}>
                  <p className="text-[18px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>{s.value}</p>
                  <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.7)" }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.p
            className="text-[11px]"
            style={{ color: "rgba(148,163,184,0.55)", cursor: "default" }}
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
                <span style={{ fontFamily: "'Sora','Inter',sans-serif", fontSize: 24, fontWeight: 800,
                  letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, cursor: "pointer" }}>
                  Skillora
                </span>
              </Link>
            </div>

            <GlassCard>
              {/* header */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }} className="mb-7">
                <h2 className="font-bold text-white mb-1.5"
                  style={{ fontSize: "1.65rem", letterSpacing: "-0.025em",
                    background: "linear-gradient(135deg,#FFFFFF 40%,rgba(196,181,253,0.9) 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Welcome back
                </h2>
                <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.85)" }}>Sign in to continue</p>
              </motion.div>

              {/* role toggle */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <RoleToggle value={role} onChange={setRole}
                  options={[{ value: "freelancer", label: "Freelancer" },{ value: "client", label: "Client" }]} />
              </motion.div>

              {/* error */}              <AnimatePresence>
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
                      <Link to="/forgot-password" className="text-[11px] font-medium transition-colors duration-200"
                        style={{ color: "rgba(129,140,248,0.65)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(167,139,250,1)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(129,140,248,0.65)"}>
                        Forgot password?
                      </Link>
                    }
                    suffix={
                      <motion.button type="button" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPw(s => !s)}
                        style={{ color: "rgba(75,85,99,0.7)", transition: "color 0.25s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(167,139,250,0.9)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(75,85,99,0.7)"}>
                        {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </motion.button>
                    }
                  />
                </motion.div>

                {/* remember me */}
                <motion.label initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
                  className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <motion.div whileTap={{ scale: 0.88 }}
                    className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{
                      background: form.rememberMe ? "linear-gradient(135deg,#635BFF,#8B5CF6)" : "rgba(255,255,255,0.05)",
                      border: form.rememberMe ? "1px solid rgba(99,91,255,0.6)" : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: form.rememberMe ? "0 0 10px rgba(99,91,255,0.35)" : "none",
                    }}
                    onClick={() => setForm(f => ({ ...f, rememberMe: !f.rememberMe }))}>
                    {form.rememberMe && (
                      <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.div>
                  <span className="text-[12px]" style={{ color: "rgba(148,163,184,0.85)" }}>Remember me for 30 days</span>
                </motion.label>

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

              {/* trust */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="mt-5 flex items-center justify-center gap-1.5">
                <ShieldCheck size={11} style={{ color: "rgba(74,222,128,0.85)" }} />
                <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.75)" }}>Secure login · End-to-end encrypted</span>
              </motion.div>

              <p className="mt-4 text-center text-[13px]" style={{ color: "rgba(148,163,184,0.85)" }}>
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold"
                  style={{ background: "linear-gradient(135deg,rgba(129,140,248,0.95),rgba(56,189,248,0.85))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Sign up free
                </Link>
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
