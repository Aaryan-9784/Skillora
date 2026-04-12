import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Eye, EyeOff, AlertCircle,
  Mail, Lock, ShieldCheck,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";
import { AuthInput, OAuthButtons } from "./_authShared";

const Login = () => {
  const [form, setForm]   = useState({ email: "", password: "", rememberMe: false });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading, errors, clearErrors } = useAuthStore();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  useEffect(() => {
    if (params.get("session") === "expired") toast.error("Session expired. Please sign in again.");
    if (params.get("error"))                 toast.error("OAuth sign-in failed. Please try again.");
    return () => clearErrors?.();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success } = await login(form);
    if (success) navigate("/dashboard");
  };

  const apiBase   = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
  const canSubmit = form.email && form.password;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* ── Background video ── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover"
        style={{ filter: "blur(0.5px)" }}
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      {/* ── Overlay layers ── */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.52)" }} />
      {/* Right-heavy: image shows left, form side darker */}
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to right, rgba(4,7,18,0.1) 0%, rgba(4,7,18,0.45) 42%, rgba(4,7,18,0.96) 68%, rgba(4,7,18,1) 100%)" }} />
      <div className="absolute inset-0 z-[3]"
        style={{ background: "linear-gradient(to top, rgba(4,7,18,0.88) 0%, transparent 40%)" }} />
      {/* Brand glow right */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 60% at 85% 50%, rgba(99,91,255,0.13) 0%, transparent 70%)" }} />
      {/* Cyan accent left */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 40% 40% at 18% 50%, rgba(56,189,248,0.05) 0%, transparent 70%)" }} />

      {/* ── Particles ── */}
      {[
        { top: "22%", left: "70%", s: 2,   d: 0.4 },
        { top: "48%", left: "80%", s: 1.5, d: 1.5 },
        { top: "68%", left: "75%", s: 2,   d: 1.0 },
        { top: "32%", left: "88%", s: 1.5, d: 2.3 },
      ].map((p, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none z-[5]"
          style={{ top: p.top, left: p.left, width: p.s, height: p.s, background: "rgba(167,139,250,0.5)" }}
          animate={{ y: [0, -10, 0], opacity: [0.1, 0.45, 0.1] }}
          transition={{ duration: 5.5 + i * 0.7, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
        />
      ))}

      {/* ── Layout ── */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_480px]">

        {/* ════ LEFT — Brand storytelling ════ */}
        <div className="hidden lg:flex flex-col justify-between px-16 py-14 select-none">

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <motion.span
                whileHover={{ filter: "drop-shadow(0 0 14px rgba(99,91,255,0.7))" }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: "'Sora','Inter',sans-serif",
                  fontSize: 26, fontWeight: 800,
                  letterSpacing: "-0.04em", color: "#fff",
                  lineHeight: 1, cursor: "pointer", display: "block",
                }}
              >
                Skillora
              </motion.span>
            </Link>
          </motion.div>

          {/* Hero copy */}
          <div className="space-y-8 max-w-[460px]">
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "rgba(129,140,248,0.65)" }}
            >
              Freelancer OS
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <h1 className="font-bold leading-[1.1] text-white"
                style={{ fontSize: "clamp(2.2rem,3.2vw,3rem)", letterSpacing: "-0.03em" }}>
                Welcome back.<br />
                Let's get you{" "}
                <span style={{
                  background: "linear-gradient(135deg,#818CF8 0%,#C4B5FD 40%,#38BDF8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(129,140,248,0.4))",
                }}>
                  back to work.
                </span>
              </h1>
              <p className="text-[14px] leading-[1.75]"
                style={{ color: "rgba(148,163,184,0.62)", maxWidth: "36ch" }}>
                Continue managing your clients, projects, and growth — all in one place.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-8"
            >
              {[
                { value: "10K+", label: "Freelancers" },
                { value: "₹2M+", label: "Revenue tracked" },
                { value: "50K+", label: "Invoices sent" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[18px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>{s.value}</p>
                  <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.7)" }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-[11px]" style={{ color: "rgba(51,65,85,0.45)" }}>
            © 2025 Skillora. All rights reserved.
          </p>
        </div>

        {/* ════ RIGHT — Login card ════ */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-10 lg:py-0">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Link to="/" style={{ textDecoration: "none" }}>
                <span style={{
                  fontFamily: "'Sora','Inter',sans-serif",
                  fontSize: 24, fontWeight: 800,
                  letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, cursor: "pointer",
                }}>
                  Skillora
                </span>
              </Link>
            </div>

            {/* Glass card */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg,rgba(10,14,32,0.38) 0%,rgba(6,9,22,0.45) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                boxShadow: [
                  "0 0 0 1px rgba(99,91,255,0.1)",
                  "0 32px 80px rgba(0,0,0,0.55)",
                  "inset 0 1px 0 rgba(255,255,255,0.1)",
                ].join(", "),
                padding: "44px 40px",
              }}>

              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
                style={{ background: "linear-gradient(90deg,transparent 5%,rgba(99,91,255,0.6) 40%,rgba(0,212,255,0.3) 65%,transparent 95%)" }} />
              {/* Corner glow */}
              <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(99,91,255,0.1) 0%,transparent 70%)" }} />

              <div className="relative">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-[1.65rem] font-bold text-white mb-1.5 tracking-[-0.025em]">
                    Welcome back
                  </h2>
                  <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.75)" }}>
                    Sign in to continue
                  </p>
                </div>

                {/* OAuth */}
                <OAuthButtons apiBase={apiBase} />

                {/* Divider */}
                <div className="flex items-center gap-3 my-7">
                  <div className="flex-1 h-px"
                    style={{ background: "linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)" }} />
                  <span className="text-[11px] tracking-[0.06em] shrink-0"
                    style={{ color: "rgba(75,85,99,0.7)" }}>
                    or continue with email
                  </span>
                  <div className="flex-1 h-px"
                    style={{ background: "linear-gradient(to left,transparent,rgba(255,255,255,0.08),transparent)" }} />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {errors?.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2.5 p-3.5 mb-5 rounded-2xl"
                      style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <AlertCircle size={13} style={{ color: "#F87171", flexShrink: 0, marginTop: 1 }} />
                      <p className="text-[13px]" style={{ color: "rgba(252,165,165,0.9)" }}>{errors.general}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AuthInput label="Email" icon={Mail} type="email" name="email"
                    placeholder="you@example.com" value={form.email} onChange={handleChange}
                    error={errors?.email} required autoComplete="email" />

                  <AuthInput label="Password" icon={Lock}
                    type={showPw ? "text" : "password"} name="password"
                    placeholder="••••••••" value={form.password}
                    onChange={handleChange} error={errors?.password}
                    required autoComplete="current-password"
                    labelRight={
                      <Link to="/forgot-password"
                        className="text-[11px] font-medium transition-colors duration-200"
                        style={{ color: "rgba(129,140,248,0.65)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(129,140,248,1)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(129,140,248,0.65)"}>
                        Forgot password?
                      </Link>
                    }
                    suffix={
                      <button type="button" onClick={() => setShowPw((s) => !s)}
                        style={{ color: "rgba(75,85,99,0.7)", transition: "color 0.25s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(148,163,184,0.9)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(75,85,99,0.7)"}>
                        {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    }
                  />

                  {/* Remember me */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        background: form.rememberMe ? "linear-gradient(135deg,#635BFF,#8B5CF6)" : "rgba(255,255,255,0.04)",
                        border: form.rememberMe ? "1px solid rgba(99,91,255,0.6)" : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: form.rememberMe ? "0 0 10px rgba(99,91,255,0.3)" : "none",
                      }}
                      onClick={() => setForm(f => ({ ...f, rememberMe: !f.rememberMe }))}
                    >
                      {form.rememberMe && (
                        <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </motion.div>
                    <span className="text-[12px]" style={{ color: "rgba(100,116,139,0.75)" }}>
                      Remember me for 30 days
                    </span>
                  </label>

                  {/* CTA */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    whileHover={canSubmit && !isLoading ? { scale: 1.02, y: -1 } : {}}
                    whileTap={canSubmit && !isLoading ? { scale: 0.98 } : {}}
                    className="relative w-full h-[52px] rounded-2xl flex items-center justify-center gap-2
                               text-[14px] font-semibold text-white overflow-hidden mt-2"
                    style={{
                      background: canSubmit && !isLoading
                        ? "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#A855F7 100%)"
                        : "rgba(255,255,255,0.05)",
                      boxShadow: canSubmit && !isLoading
                        ? "0 0 0 1px rgba(139,92,246,0.4), 0 8px 32px rgba(99,91,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
                        : "none",
                      color: canSubmit && !isLoading ? "#fff" : "rgba(75,85,99,0.5)",
                      cursor: isLoading || !canSubmit ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {canSubmit && !isLoading && (
                      <>
                        <motion.div className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)",
                            backgroundSize: "200% 100%",
                          }}
                          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
                        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
                          style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" }} />
                      </>
                    )}
                    {isLoading ? (
                      <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Signing in…</>
                    ) : (
                      <>Sign in <ArrowRight size={15} strokeWidth={2.5} /></>
                    )}
                  </motion.button>
                </form>

                {/* Trust hint */}
                <div className="mt-5 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={11} style={{ color: "rgba(74,222,128,0.7)" }} />
                  <span className="text-[11px]" style={{ color: "rgba(75,85,99,0.65)" }}>
                    Secure login · End-to-end encrypted
                  </span>
                </div>

                {/* Footer */}
                <p className="mt-4 text-center text-[13px]" style={{ color: "rgba(75,85,99,0.8)" }}>
                  Don't have an account?{" "}
                  <Link to="/register" className="font-semibold"
                    style={{
                      background: "linear-gradient(135deg,rgba(129,140,248,0.95),rgba(56,189,248,0.85))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                    Sign up free
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Login;
