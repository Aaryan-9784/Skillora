/**
 * Register — Grid-based split layout. 1.2fr left / 0.8fr right.
 * Design: Stripe × Linear × Apple — balanced, premium, cinematic.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2,
  User, Mail, Lock,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { AuthInput, OAuthButtons, BG_REGISTER } from "./_authShared";

// ─────────────────────────────────────────────────────────
// PASSWORD STRENGTH
// ─────────────────────────────────────────────────────────
const CHECKS = [
  { label: "8+ chars", test: (p) => p.length >= 8 },
  { label: "Letter",   test: (p) => /[A-Za-z]/.test(p) },
  { label: "Number",   test: (p) => /\d/.test(p) },
];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score  = CHECKS.filter((c) => c.test(password)).length;
  const colors = ["#EF4444", "#F59E0B", "#22C55E"];
  const labels = ["Weak", "Fair", "Strong"];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="mt-2.5 space-y-1.5">
      <div className="h-[2px] w-full rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(score / 3) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: colors[score - 1] || colors[0] }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {CHECKS.map((c) => (
            <span key={c.label} className="flex items-center gap-1 text-[10px] transition-colors duration-300"
              style={{ color: c.test(password) ? "rgba(74,222,128,0.8)" : "rgba(75,85,99,0.7)" }}>
              <CheckCircle2 size={8} />{c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className="text-[10px] font-semibold" style={{ color: colors[score - 1] }}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
const Register = () => {
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { register, isLoading, errors, clearErrors } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => () => clearErrors?.(), []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success } = await register(form);
    if (success) navigate("/dashboard");
  };

  const apiBase   = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
  const canSubmit = form.name && form.email && form.password.length >= 8;

  return (
    /* ── Root: full-screen background ── */
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* ── Background image — Ken Burns ── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 24, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
        style={{
          backgroundImage: `url("${BG_REGISTER}")`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      />

      {/* ── Overlay stack ── */}
      {/* Base tint */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.50)" }} />
      {/* Right-heavy: left bright (image shows), right dark (form focus) */}
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to left, rgba(4,7,18,0.97) 0%, rgba(4,7,18,0.80) 30%, rgba(4,7,18,0.35) 58%, rgba(4,7,18,0.05) 100%)" }} />
      {/* Bottom vignette */}
      <div className="absolute inset-0 z-[3]"
        style={{ background: "linear-gradient(to top, rgba(4,7,18,0.92) 0%, transparent 42%)" }} />
      {/* Top vignette */}
      <div className="absolute inset-0 z-[3]"
        style={{ background: "linear-gradient(to bottom, rgba(4,7,18,0.65) 0%, transparent 22%)" }} />
      {/* Edge vignette */}
      <div className="absolute inset-0 z-[3]"
        style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(4,7,18,0.65) 100%)" }} />
      {/* Brand glow — right side */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 45% 55% at 88% 52%, rgba(99,91,255,0.10) 0%, transparent 70%)" }} />
      {/* Warm accent — left */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 55% 50% at 25% 45%, rgba(56,189,248,0.04) 0%, transparent 70%)" }} />

      {/* Particles */}
      {[
        { top: "20%", left: "72%", s: 2,   d: 0.5 },
        { top: "46%", left: "82%", s: 1.5, d: 1.7 },
        { top: "66%", left: "76%", s: 2,   d: 1.1 },
        { top: "30%", left: "88%", s: 1.5, d: 2.5 },
      ].map((p, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none z-[5]"
          style={{ top: p.top, left: p.left, width: p.s, height: p.s, background: "rgba(167,139,250,0.4)" }}
          animate={{ y: [0, -10, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 5.5 + i * 0.7, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
        />
      ))}

      {/* ── GRID LAYOUT: 1.2fr left / 0.8fr right ── */}
      <div className="relative z-10 min-h-screen
                      grid grid-cols-1
                      lg:grid-cols-[1fr_480px]">

        {/* ════════════════════════════════════════
            LEFT — Brand content
        ════════════════════════════════════════ */}
        <div className="hidden lg:flex flex-col justify-between px-16 py-14 select-none">

          {/* Logo — Stripe-style wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
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

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-9 max-w-[480px]"
          >
            {/* Eyebrow */}
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "rgba(129,140,248,0.6)" }}>
              Freelancer OS
            </p>

            {/* Headline + subtext */}
            <div className="space-y-5">
              <h1 className="font-semibold leading-[1.12] text-white"
                style={{
                  fontSize: "clamp(2rem,3vw,2.75rem)",
                  letterSpacing: "-0.025em",
                  textShadow: "0 4px 40px rgba(0,0,0,0.5)",
                }}>
                The smarter way to<br />
                <span style={{
                  background: "linear-gradient(135deg,#818CF8 0%,#38BDF8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  run your freelance business.
                </span>
              </h1>
              <p className="text-[14px] leading-[1.7] font-light"
                style={{ color: "rgba(148,163,184,0.68)", maxWidth: "34ch" }}>
                Projects, clients, invoices, and AI — unified in one
                platform built for independent professionals.
              </p>
            </div>

            {/* Feature stack */}
            
          </motion.div>

          {/* Footer */}
          <p className="text-[11px]" style={{ color: "rgba(51,65,85,0.5)" }}>
            © 2025 Skillora. All rights reserved.
          </p>
        </div>

        {/* ════════════════════════════════════════
            RIGHT — Signup form
        ════════════════════════════════════════ */}
        <div className="flex items-center justify-center px-6 py-10 lg:px-12 lg:py-0">

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px]"
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

            {/* Glass card */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg,rgba(10,14,32,0.84) 0%,rgba(6,9,22,0.90) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                boxShadow: [
                  "0 0 0 1px rgba(99,91,255,0.07)",
                  "0 28px 80px rgba(0,0,0,0.75)",
                  "0 0 60px rgba(99,91,255,0.05)",
                  "inset 0 1px 0 rgba(255,255,255,0.07)",
                ].join(", "),
                padding: "40px 36px",
              }}>

              {/* Top shimmer */}
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
                style={{ background: "linear-gradient(90deg,transparent 10%,rgba(99,91,255,0.5) 40%,rgba(139,92,246,0.3) 60%,transparent 90%)" }} />
              {/* Inner glow top-right */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(99,91,255,0.09) 0%,transparent 70%)" }} />

              <div className="relative">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-[1.6rem] font-semibold text-white mb-2 tracking-[-0.025em]">
                    Create your account
                  </h2>
                  <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.8)" }}>
                    Join thousands of freelancers managing their work smarter.
                  </p>
                </div>

                {/* OAuth */}
                <OAuthButtons apiBase={apiBase} />

                {/* Divider */}
                <div className="flex items-center gap-4 my-7">
                  <div className="flex-1 h-px"
                    style={{ background: "linear-gradient(to right,transparent,rgba(255,255,255,0.07),transparent)" }} />
                  <span className="text-[11px] tracking-[0.08em] shrink-0"
                    style={{ color: "rgba(75,85,99,0.75)" }}>
                    or continue with email
                  </span>
                  <div className="flex-1 h-px"
                    style={{ background: "linear-gradient(to left,transparent,rgba(255,255,255,0.07),transparent)" }} />
                </div>

                {/* Error */}
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <AuthInput label="Full name" icon={User} type="text" name="name"
                    placeholder="Jane Doe" value={form.name} onChange={handleChange}
                    error={errors?.name} required autoComplete="name" />

                  <AuthInput label="Email address" icon={Mail} type="email" name="email"
                    placeholder="you@example.com" value={form.email} onChange={handleChange}
                    error={errors?.email} required autoComplete="email" />

                  <div>
                    <AuthInput label="Password" icon={Lock}
                      type={showPw ? "text" : "password"} name="password"
                      placeholder="Min. 8 characters" value={form.password}
                      onChange={handleChange} error={errors?.password}
                      required minLength={8} autoComplete="new-password"
                      suffix={
                        <button type="button" onClick={() => setShowPw((s) => !s)}
                          style={{ color: "rgba(75,85,99,0.7)", transition: "color 0.25s" }}
                          onMouseEnter={e => e.currentTarget.style.color = "rgba(148,163,184,0.9)"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(75,85,99,0.7)"}>
                          {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      }
                    />
                    <AnimatePresence>
                      {form.password && <PasswordStrength password={form.password} />}
                    </AnimatePresence>
                  </div>

                  {/* CTA */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    whileHover={canSubmit && !isLoading ? { scale: 1.01, y: -1.5 } : {}}
                    whileTap={canSubmit && !isLoading ? { scale: 0.985 } : {}}
                    className="relative w-full h-[52px] rounded-2xl flex items-center justify-center gap-2
                               text-[13.5px] font-semibold text-white overflow-hidden mt-2"
                    style={{
                      background: canSubmit && !isLoading
                        ? "linear-gradient(135deg,#5B54F0 0%,#7C6FF7 50%,#6366F1 100%)"
                        : "rgba(255,255,255,0.05)",
                      boxShadow: canSubmit && !isLoading
                        ? "0 0 28px rgba(99,91,255,0.38), 0 10px 36px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.14)"
                        : "none",
                      color: canSubmit && !isLoading ? "#fff" : "rgba(75,85,99,0.55)",
                      cursor: isLoading || !canSubmit ? "not-allowed" : "pointer",
                      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {canSubmit && !isLoading && (
                      <motion.div className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.11) 50%,transparent 65%)",
                          backgroundSize: "200% 100%",
                        }}
                        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }} />
                    )}
                    {isLoading ? (
                      <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Creating account…</>
                    ) : (
                      <>Create account <ArrowRight size={14} strokeWidth={2} /></>
                    )}
                  </motion.button>
                </form>

                {/* Footer */}
                <div className="mt-6 space-y-3">
                  <p className="text-center text-[11px]" style={{ color: "rgba(55,65,81,0.85)" }}>
                    By signing up, you agree to our{" "}
                    <a href="#" style={{ color: "rgba(129,140,248,0.7)", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "rgba(129,140,248,1)"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(129,140,248,0.7)"}>
                      Terms
                    </a>{" "}and{" "}
                    <a href="#" style={{ color: "rgba(129,140,248,0.7)", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "rgba(129,140,248,1)"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(129,140,248,0.7)"}>
                      Privacy Policy
                    </a>.
                  </p>
                  <p className="text-center text-[13px]" style={{ color: "rgba(75,85,99,0.8)" }}>
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold"
                      style={{
                        background: "linear-gradient(135deg,rgba(129,140,248,0.9),rgba(56,189,248,0.8))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        transition: "opacity 0.2s",
                      }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>{/* /grid */}
    </div>
  );
};

export default Register;
