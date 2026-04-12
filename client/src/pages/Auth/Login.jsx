/**
 * Login — Luxury full-screen bg, RIGHT-side floating form.
 * Mirrors Register layout for visual consistency.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, Eye, EyeOff, AlertCircle, Mail, Lock } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";
import { AuthPageShell, GlassCard, AuthInput, OAuthButtons } from "./_authShared";

const Login = () => {
  const [form, setForm]     = useState({ email: "", password: "", rememberMe: false });
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
    <AuthPageShell>

      {/* ══════════════════════════════════════════
          LEFT — Cinematic empty space
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 pointer-events-none select-none">

        {/* Logo — Stripe-style wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span style={{
            fontFamily: "'Sora', 'Inter', sans-serif",
            fontSize: "26px",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
            textShadow: "0 2px 16px rgba(0,0,0,0.4)",
            lineHeight: 1,
          }}>
            Skillora
          </span>
        </motion.div>

        {/* Ghost tagline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: "rgba(99,91,255,0.45)" }}>
            Freelancer OS
          </p>
          <h2 className="text-4xl font-semibold leading-[1.15]"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.12) 0%,rgba(255,255,255,0.04) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}>
            Welcome<br />back.
          </h2>
        </motion.div>

        <p className="text-[11px]" style={{ color: "rgba(51,65,85,0.6)" }}>
          © 2025 Skillora
        </p>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — Floating form
      ══════════════════════════════════════════ */}
      <div className="flex items-center justify-center w-full
                      lg:w-auto lg:justify-end
                      px-5 py-10
                      lg:pr-16 lg:pl-8 lg:py-0">

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <span style={{
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
              lineHeight: 1,
            }}>
              Skillora
            </span>
          </div>

          <GlassCard>
            {/* ── Header ── */}
            <div className="mb-8">
              <h1 className="text-[1.55rem] font-semibold text-white mb-2 tracking-[-0.02em]">
                Welcome back
              </h1>
              <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.8)" }}>
                Sign in to continue
              </p>
            </div>

            {/* ── OAuth ── */}
            <OAuthButtons apiBase={apiBase} />

            {/* ── Divider ── */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px"
                style={{ background: "linear-gradient(to right,transparent,rgba(255,255,255,0.07),transparent)" }} />
              <span className="text-[11px] tracking-[0.08em] shrink-0"
                style={{ color: "rgba(75,85,99,0.8)" }}>
                or
              </span>
              <div className="flex-1 h-px"
                style={{ background: "linear-gradient(to left,transparent,rgba(255,255,255,0.07),transparent)" }} />
            </div>

            {/* ── Error ── */}
            <AnimatePresence>
              {errors?.general && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-2.5 p-3.5 mb-6 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <AlertCircle size={13} style={{ color: "#F87171", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[13px]" style={{ color: "rgba(252,165,165,0.9)" }}>{errors.general}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  className="w-4 h-4 rounded-md flex items-center justify-center transition-all duration-300 shrink-0"
                  style={{
                    background: form.rememberMe ? "linear-gradient(135deg,#635BFF,#8B5CF6)" : "rgba(255,255,255,0.04)",
                    border: form.rememberMe ? "1px solid rgba(99,91,255,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: form.rememberMe ? "0 0 10px rgba(99,91,255,0.3)" : "none",
                  }}
                  onClick={() => setForm(f => ({ ...f, rememberMe: !f.rememberMe }))}>
                  {form.rememberMe && (
                    <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-[12px]" style={{ color: "rgba(75,85,99,0.8)" }}>
                  Remember me for 30 days
                </span>
              </label>

              {/* ── CTA ── */}
              <motion.button
                type="submit"
                disabled={isLoading || !canSubmit}
                whileHover={canSubmit && !isLoading ? { scale: 1.01, y: -1 } : {}}
                whileTap={canSubmit && !isLoading ? { scale: 0.985 } : {}}
                className="relative w-full h-[50px] rounded-2xl flex items-center justify-center gap-2
                           text-[13px] font-semibold text-white overflow-hidden mt-2"
                style={{
                  background: canSubmit && !isLoading
                    ? "linear-gradient(135deg,#5B54F0 0%,#7C6FF7 50%,#6366F1 100%)"
                    : "rgba(255,255,255,0.05)",
                  boxShadow: canSubmit && !isLoading
                    ? "0 0 24px rgba(99,91,255,0.35), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)"
                    : "none",
                  color: canSubmit && !isLoading ? "#fff" : "rgba(75,85,99,0.6)",
                  cursor: isLoading || !canSubmit ? "not-allowed" : "pointer",
                  transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                  letterSpacing: "0.01em",
                }}
              >
                {canSubmit && !isLoading && (
                  <motion.div className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.1) 50%,transparent 65%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }} />
                )}
                {isLoading ? (
                  <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Signing in…</>
                ) : (
                  <>Sign in <ArrowRight size={14} strokeWidth={2} /></>
                )}
              </motion.button>
            </form>

            {/* ── Footer ── */}
            <p className="mt-6 text-center text-[13px]" style={{ color: "rgba(75,85,99,0.8)" }}>
              Don&apos;t have an account?{" "}
              <Link to="/register"
                className="font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg,rgba(129,140,248,0.9),rgba(56,189,248,0.8))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                Sign up free
              </Link>
            </p>
          </GlassCard>
        </motion.div>
      </div>

    </AuthPageShell>
  );
};

export default Login;
