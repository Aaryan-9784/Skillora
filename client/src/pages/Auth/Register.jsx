import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2,
  User, Mail, Lock, Kanban, Brain, FileText, Users,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { AuthInput, OAuthButtons } from "./_authShared";

// ── Password strength ──────────────────────────────────────
const CHECKS = [
  { label: "8+ chars", test: (p) => p.length >= 8 },
  { label: "Letter",   test: (p) => /[A-Za-z]/.test(p) },
  { label: "Number",   test: (p) => /\d/.test(p) },
];

const PasswordStrength = ({ password }) => {
  const score  = CHECKS.filter((c) => c.test(password)).length;
  const colors = ["#EF4444", "#F59E0B", "#22C55E"];
  const labels = ["Weak", "Fair", "Strong"];
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} className="mt-2.5 space-y-1.5">
      <div className="h-[2px] w-full rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(score / 3) * 100}%` }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: colors[score - 1] || colors[0] }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {CHECKS.map((c) => (
            <span key={c.label} className="flex items-center gap-1 text-[10px] transition-colors duration-300"
              style={{ color: c.test(password) ? "rgba(74,222,128,0.85)" : "rgba(75,85,99,0.65)" }}>
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

// ── Feature pill ───────────────────────────────────────────
const Feature = ({ icon: Icon, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    className="flex items-center gap-3"
  >
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
      <Icon size={14} style={{ color: "#A39AFF" }} />
    </div>
    <span className="text-[13px] font-medium" style={{ color: "rgba(203,213,225,0.75)" }}>{text}</span>
  </motion.div>
);

// ── Main ───────────────────────────────────────────────────
const Register = () => {
  const [form, setForm]   = useState({ name: "", email: "", password: "" });
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
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* ── Background video ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover"
        style={{ filter: "blur(0.5px)" }}
      >
        <source src="/videos/signup-bg.mp4" type="video/mp4" />
      </video>

      {/* ── Overlay layers ── */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.55)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to right, rgba(4,7,18,0.15) 0%, rgba(4,7,18,0.5) 45%, rgba(4,7,18,0.97) 70%, rgba(4,7,18,1) 100%)" }} />
      <div className="absolute inset-0 z-[3]"
        style={{ background: "linear-gradient(to top, rgba(4,7,18,0.9) 0%, transparent 40%)" }} />
      {/* Brand glow right */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 60% at 85% 50%, rgba(99,91,255,0.12) 0%, transparent 70%)" }} />
      {/* Cyan accent left */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 40% 40% at 20% 50%, rgba(56,189,248,0.05) 0%, transparent 70%)" }} />

      {/* ── Particles ── */}
      {[
        { top: "18%", left: "68%", s: 2,   d: 0.3 },
        { top: "44%", left: "79%", s: 1.5, d: 1.4 },
        { top: "70%", left: "73%", s: 2,   d: 0.9 },
        { top: "28%", left: "86%", s: 1.5, d: 2.2 },
        { top: "58%", left: "91%", s: 1,   d: 1.8 },
      ].map((p, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none z-[5]"
          style={{ top: p.top, left: p.left, width: p.s, height: p.s, background: "rgba(167,139,250,0.5)" }}
          animate={{ y: [0, -12, 0], opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 5 + i * 0.8, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
        />
      ))}

      {/* ── Layout ── */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_500px]">

        {/* ════ LEFT — Brand storytelling ════ */}
        <div className="hidden lg:flex flex-col justify-between px-16 py-14 select-none">

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <span style={{
                fontFamily: "'Sora','Inter',sans-serif",
                fontSize: 26, fontWeight: 800,
                letterSpacing: "-0.04em", color: "#fff",
                textShadow: "0 0 20px rgba(99,91,255,0.4)", lineHeight: 1, cursor: "pointer",
              }}>
                Skillora
              </span>
            </Link>
          </motion.div>

          {/* Hero copy */}
          <div className="space-y-10 max-w-[500px]">
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
                Run your freelance business<br />with{" "}
                <span style={{
                  background: "linear-gradient(135deg,#818CF8 0%,#C4B5FD 40%,#38BDF8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(129,140,248,0.4))",
                }}>
                  clarity &amp; control.
                </span>
              </h1>
              <p className="text-[14px] leading-[1.75]"
                style={{ color: "rgba(148,163,184,0.65)", maxWidth: "38ch" }}>
                Manage clients, projects, invoices, and growth — all in one intelligent workspace.
              </p>
            </motion.div>

            {/* Feature points */}
            <div className="space-y-4">
              <Feature icon={Kanban}   text="Smart project tracking"   delay={0.4} />
              <Feature icon={Brain}    text="AI-powered insights"       delay={0.5} />
              <Feature icon={FileText} text="Seamless invoicing"        delay={0.6} />
              <Feature icon={Users}    text="Client relationship hub"   delay={0.7} />
            </div>

            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full"
              style={{
                background: "rgba(99,91,255,0.1)",
                border: "1px solid rgba(99,91,255,0.2)",
              }}
            >
              <div className="flex -space-x-1.5">
                {["#635BFF","#10B981","#F59E0B","#00D4FF"].map((c) => (
                  <div key={c} className="w-5 h-5 rounded-full border border-black/30"
                    style={{ background: c }} />
                ))}
              </div>
              <span className="text-[12px] font-medium" style={{ color: "rgba(203,213,225,0.75)" }}>
                Trusted by <span style={{ color: "#A39AFF" }}>10,000+</span> freelancers
              </span>
            </motion.div>
          </div>

          <p className="text-[11px]" style={{ color: "rgba(51,65,85,0.45)" }}>
            © 2025 Skillora. All rights reserved.
          </p>
        </div>

        {/* ════ RIGHT — Signup card ════ */}
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
                background: "linear-gradient(160deg,rgba(10,14,32,0.35) 0%,rgba(6,9,22,0.42) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                boxShadow: [
                  "0 0 0 1px rgba(99,91,255,0.1)",
                  "0 32px 80px rgba(0,0,0,0.6)",
                  "0 0 80px rgba(99,91,255,0.06)",
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
                    Create your account
                  </h2>
                  <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.75)" }}>
                    Start your journey today. Free forever.
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
                      <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Creating workspace…</>
                    ) : (
                      <>Create your workspace <ArrowRight size={15} strokeWidth={2.5} /></>
                    )}
                  </motion.button>
                </form>

                {/* Footer */}
                <div className="mt-6 space-y-3">
                  <p className="text-center text-[11px]" style={{ color: "rgba(55,65,81,0.8)" }}>
                    By signing up, you agree to our{" "}
                    <a href="#" className="transition-colors duration-200 hover:text-indigo-300"
                      style={{ color: "rgba(129,140,248,0.7)" }}>Terms</a>{" "}and{" "}
                    <a href="#" className="transition-colors duration-200 hover:text-indigo-300"
                      style={{ color: "rgba(129,140,248,0.7)" }}>Privacy Policy</a>.
                  </p>
                  <p className="text-center text-[13px]" style={{ color: "rgba(75,85,99,0.8)" }}>
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold"
                      style={{
                        background: "linear-gradient(135deg,rgba(129,140,248,0.95),rgba(56,189,248,0.85))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Register;
