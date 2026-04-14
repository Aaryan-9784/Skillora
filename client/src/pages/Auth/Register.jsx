import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2,
  User, Mail, Lock, Kanban, Brain, FileText, Users,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import {
  AuthInput, OAuthButtons, RoleToggle, GlassCard, CTAButton, CursorGlow,
} from "./_authShared";

// ── Password strength ──────────────────────────────────────────────────────
const CHECKS = [
  { label: "8+ chars", test: p => p.length >= 8 },
  { label: "Letter",   test: p => /[A-Za-z]/.test(p) },
  { label: "Number",   test: p => /\d/.test(p) },
];

const PasswordStrength = ({ password }) => {
  const score  = CHECKS.filter(c => c.test(password)).length;
  const colors = ["#EF4444","#F59E0B","#22C55E"];
  const labels = ["Weak","Fair","Strong"];
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} className="mt-2.5 space-y-1.5">
      <div className="h-[2px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }} animate={{ width: `${(score/3)*100}%` }}
          transition={{ duration: 0.45, ease: [0.4,0,0.2,1] }}
          style={{ background: colors[score-1] || colors[0] }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {CHECKS.map(c => (
            <span key={c.label} className="flex items-center gap-1 text-[10px] transition-colors duration-300"
              style={{ color: c.test(password) ? "rgba(74,222,128,0.85)" : "rgba(75,85,99,0.65)" }}>
              <CheckCircle2 size={8} />{c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className="text-[10px] font-semibold" style={{ color: colors[score-1] }}>{labels[score-1]}</span>}
      </div>
    </motion.div>
  );
};

// ── Feature item ───────────────────────────────────────────────────────────
const Feature = ({ icon: Icon, text, delay }) => (
  <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.16,1,0.3,1] }}
    className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
      <Icon size={14} style={{ color: "#A39AFF" }} />
    </div>
    <span className="text-[13px] font-medium" style={{ color: "rgba(203,213,225,0.75)" }}>{text}</span>
  </motion.div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const Register = () => {
  const [role, setRole]     = useState("freelancer");
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { register, isLoading, errors, clearErrors } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => () => clearErrors?.(), []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async e => {
    e.preventDefault();
    const { success, role: userRole } = await register({ ...form, role });
    if (success) {
      if (userRole === "client") navigate("/client/dashboard");
      else navigate("/dashboard");
    }
  };

  const apiBase   = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
  const canSubmit = form.name && form.email && form.password.length >= 8;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* video bg */}
      <video autoPlay muted loop playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-80"
        style={{ filter: "blur(0.5px)" }}>
        <source src="/videos/signup-bg.mp4" type="video/mp4" />
      </video>

      {/* overlays */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.12)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to right,rgba(4,7,18,0.0) 0%,rgba(4,7,18,0.1) 45%,rgba(4,7,18,0.45) 70%,rgba(4,7,18,0.6) 100%)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to top,rgba(4,7,18,0.3) 0%,transparent 40%)" }} />

      {/* animated orbs */}
      <motion.div className="absolute rounded-full pointer-events-none z-[1]"
        animate={{ x: [0,60,0], y: [0,-40,0], scale: [1,1.15,1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 700, height: 700, top: "-20%", left: "-15%",
          background: "radial-gradient(circle,rgba(99,91,255,0.1) 0%,transparent 65%)" }} />
      <motion.div className="absolute rounded-full pointer-events-none z-[1]"
        animate={{ x: [0,-50,0], y: [0,60,0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        style={{ width: 500, height: 500, bottom: "-10%", right: "5%",
          background: "radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 65%)" }} />

      {/* brand glow */}
      <div className="absolute inset-0 z-[3] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 60% at 85% 50%,rgba(99,91,255,0.11) 0%,transparent 70%)" }} />

      <CursorGlow />

      {/* particles */}
      {[
        { top: "18%", left: "68%", s: 2,   d: 0.3 },
        { top: "44%", left: "79%", s: 1.5, d: 1.4 },
        { top: "70%", left: "73%", s: 2,   d: 0.9 },
        { top: "28%", left: "86%", s: 1.5, d: 2.2 },
        { top: "58%", left: "91%", s: 1,   d: 1.8 },
      ].map((p, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none z-[5]"
          style={{ top: p.top, left: p.left, width: p.s, height: p.s, background: "rgba(167,139,250,0.5)" }}
          animate={{ y: [0,-12,0], opacity: [0.1,0.5,0.1] }}
          transition={{ duration: 5 + i * 0.8, repeat: Infinity, delay: p.d, ease: "easeInOut" }} />
      ))}

      {/* layout */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_500px]">

        {/* LEFT */}
        <div className="hidden lg:flex flex-col justify-between px-16 py-14 select-none">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <span style={{ fontFamily: "'Sora','Inter',sans-serif", fontSize: 26, fontWeight: 800,
                letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, cursor: "pointer",
                textShadow: "0 0 20px rgba(99,91,255,0.4)" }}>
                Skillora
              </span>
            </Link>
          </motion.div>

          <div className="space-y-10 max-w-[500px]">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-[10px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "rgba(129,140,248,0.65)" }}>Freelancer OS</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.16,1,0.3,1] }}
              className="space-y-5" style={{ cursor: "default" }}>
              <h1 className="font-bold leading-[1.1] text-white"
                style={{ fontSize: "clamp(2.2rem,3.2vw,3rem)", letterSpacing: "-0.03em" }}>
                Run your freelance business<br />with{" "}
                <span style={{
                  background: "linear-gradient(135deg,#818CF8 0%,#C4B5FD 40%,#38BDF8 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(129,140,248,0.4))",
                }}>clarity &amp; control.</span>
              </h1>
              <p className="text-[14px] leading-[1.75]"
                style={{ color: "rgba(148,163,184,0.65)", maxWidth: "38ch" }}>
                Manage clients, projects, invoices, and growth — all in one intelligent workspace.
              </p>
            </motion.div>
            <motion.div className="space-y-4" whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }} style={{ cursor: "default" }}>
              <Feature icon={Kanban}   text="Smart project tracking"  delay={0.4} />
              <Feature icon={Brain}    text="AI-powered insights"      delay={0.5} />
              <Feature icon={FileText} text="Seamless invoicing"       delay={0.6} />
              <Feature icon={Users}    text="Client relationship hub"  delay={0.7} />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
              whileHover={{ y: -3 }} style={{ cursor: "default" }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full"
              style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)" }}>
              <div className="flex -space-x-1.5">
                {["#635BFF","#10B981","#F59E0B","#00D4FF"].map(c => (
                  <div key={c} className="w-5 h-5 rounded-full border border-black/30" style={{ background: c }} />
                ))}
              </div>
              <span className="text-[12px] font-medium" style={{ color: "rgba(203,213,225,0.75)" }}>
                Trusted by <span style={{ color: "#A39AFF" }}>10,000+</span> freelancers
              </span>
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

        {/* RIGHT */}
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
                  Create your account
                </h2>
                <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.85)" }}>
                  Start your journey today. Free forever.
                </p>
              </motion.div>

              {/* role toggle */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <RoleToggle value={role} onChange={setRole}
                  options={[{ value: "freelancer", label: "I'm a Freelancer" },{ value: "client", label: "I'm a Client" }]} />
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
                  <AuthInput label="Full name" icon={User} type="text" name="name"
                    placeholder="Jane Doe" value={form.name} onChange={handleChange}
                    error={errors?.name} required autoComplete="name" />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36 }}>
                  <AuthInput label="Email address" icon={Mail} type="email" name="email"
                    placeholder="you@example.com" value={form.email} onChange={handleChange}
                    error={errors?.email} required autoComplete="email" />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 }}>
                  <div>
                    <AuthInput label="Password" icon={Lock}
                      type={showPw ? "text" : "password"} name="password"
                      placeholder="Min. 8 characters" value={form.password}
                      onChange={handleChange} error={errors?.password}
                      required minLength={8} autoComplete="new-password"
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
                    <AnimatePresence>
                      {form.password && <PasswordStrength password={form.password} />}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
                  <CTAButton disabled={!canSubmit} isLoading={isLoading}>
                    {isLoading
                      ? <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Creating workspace…</>
                      : <>Create your workspace <ArrowRight size={15} strokeWidth={2.5} /></>
                    }
                  </CTAButton>
                </motion.div>

                {/* OAuth — below CTA */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}>
                  <OAuthButtons apiBase={apiBase} role={role} label="or sign up with" />
                </motion.div>
              </form>

              {/* footer */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="mt-6 space-y-3">
                <p className="text-center text-[11px]" style={{ color: "rgba(148,163,184,0.75)" }}>
                  By signing up, you agree to our{" "}
                  <a href="#" style={{ color: "rgba(129,140,248,0.7)" }}
                    onMouseEnter={e => e.currentTarget.style.color = "rgba(167,139,250,1)"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(129,140,248,0.7)"}>Terms</a>{" "}and{" "}
                  <a href="#" style={{ color: "rgba(129,140,248,0.7)" }}
                    onMouseEnter={e => e.currentTarget.style.color = "rgba(167,139,250,1)"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(129,140,248,0.7)"}>Privacy Policy</a>.
                </p>
                <p className="text-center text-[13px]" style={{ color: "rgba(148,163,184,0.85)" }}>
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold"
                    style={{ background: "linear-gradient(135deg,rgba(129,140,248,0.95),rgba(56,189,248,0.85))",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
