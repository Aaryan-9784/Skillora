import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { AuthInput, GlassCard, CTAButton, CursorGlow } from "./_authShared";

// ── Resend countdown ───────────────────────────────────────────────────────
const ResendTimer = ({ onResend }) => {
  const [secs, setSecs] = useState(30);
  useEffect(() => {
    if (secs === 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  return secs > 0 ? (
    <p className="text-[12px]" style={{ color: "rgba(148,163,184,0.6)" }}>
      Resend in{" "}
      <span style={{ color: "rgba(129,140,248,0.9)", fontWeight: 600 }}>{secs}s</span>
    </p>
  ) : (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => { onResend(); setSecs(30); }}
      className="text-[12px] font-semibold"
      style={{
        background: "linear-gradient(135deg,rgba(129,140,248,0.95),rgba(56,189,248,0.85))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      Resend email
    </motion.button>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
const ForgotPassword = () => {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const { forgotPassword, isLoading } = useAuthStore();

  const handleSubmit = async e => {
    e.preventDefault();
    const { success } = await forgotPassword(email);
    if (success) setSent(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* video bg */}
      <video autoPlay muted loop playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-80"
        style={{ filter: "blur(0.5px)" }}>
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      {/* overlay stack */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.12)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to right,rgba(4,7,18,0.0) 0%,rgba(4,7,18,0.1) 42%,rgba(4,7,18,0.45) 68%,rgba(4,7,18,0.6) 100%)" }} />
      <div className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to top,rgba(4,7,18,0.3) 0%,transparent 40%)" }} />

      {/* animated orbs */}
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

      <CursorGlow />

      {/* particles */}
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

      {/* layout */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_480px]">

        {/* LEFT — brand */}
        <div className="hidden lg:flex flex-col justify-between px-16 py-14 select-none">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <motion.span
                whileHover={{ filter: "drop-shadow(0 0 14px rgba(99,91,255,0.7))" }}
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
              Account Recovery
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.16,1,0.3,1] }}
              className="space-y-5" style={{ cursor: "default" }}>
              <h1 className="font-bold leading-[1.1] text-white"
                style={{ fontSize: "clamp(2.2rem,3.2vw,3rem)", letterSpacing: "-0.03em" }}>
                Happens to the{" "}<br />
                <span style={{
                  background: "linear-gradient(135deg,#818CF8 0%,#C4B5FD 40%,#38BDF8 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(129,140,248,0.4))",
                }}>best of us.</span>
              </h1>
              <p className="text-[14px] leading-[1.75]"
                style={{ color: "rgba(148,163,184,0.62)", maxWidth: "36ch" }}>
                We'll send a secure reset link straight to your inbox. Back in seconds.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ cursor: "default",
                background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.18)" }}>
              <ShieldCheck size={16} style={{ color: "rgba(74,222,128,0.85)", flexShrink: 0 }} />
              <span className="text-[13px]" style={{ color: "rgba(203,213,225,0.75)" }}>
                Secure · Encrypted · Expires in 1 hour
              </span>
            </motion.div>
          </div>

          <motion.p className="text-[11px]"
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
              <AnimatePresence mode="wait">

                {/* ── Success state ── */}
                {sent ? (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.45, ease: [0.16,1,0.3,1] }}
                    className="text-center">

                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 16 }}
                      className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                      style={{
                        background: "rgba(99,91,255,0.12)",
                        border: "1px solid rgba(99,91,255,0.3)",
                        boxShadow: "0 0 40px rgba(99,91,255,0.2)",
                      }}>
                      <Mail size={28} style={{ color: "#818CF8" }} />
                    </motion.div>

                    <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="font-bold mb-2"
                      style={{ fontSize: "1.65rem", letterSpacing: "-0.025em",
                        background: "linear-gradient(135deg,#FFFFFF 40%,rgba(196,181,253,0.9) 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Check your inbox 📩
                    </motion.h2>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
                      className="text-[13px] leading-[1.7] mb-6"
                      style={{ color: "rgba(148,163,184,0.85)" }}>
                      We sent a reset link to{" "}
                      <span style={{ color: "rgba(203,213,225,0.95)", fontWeight: 500 }}>{email}</span>.
                      <br />Check your spam folder if you don't see it.
                    </motion.p>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                      className="flex items-center justify-center gap-1.5 mb-6">
                      <ShieldCheck size={11} style={{ color: "rgba(74,222,128,0.85)" }} />
                      <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.75)" }}>
                        Link expires in 1 hour
                      </span>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                      className="flex flex-col items-center gap-4">
                      <ResendTimer onResend={() => forgotPassword(email)} />
                      <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <Link to="/login" style={{ textDecoration: "none", width: "100%" }}>
                        <motion.span whileHover={{ x: -2 }}
                          className="flex items-center justify-center gap-1.5 text-[13px]"
                          style={{ color: "rgba(148,163,184,0.75)", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.color = "rgba(203,213,225,0.95)"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(148,163,184,0.75)"}>
                          <ArrowLeft size={13} /> Back to sign in
                        </motion.span>
                      </Link>
                    </motion.div>
                  </motion.div>

                ) : (

                  /* ── Form state ── */
                  <motion.div key="form"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }} className="mb-7">
                      <h2 className="font-bold text-white mb-1.5"
                        style={{ fontSize: "1.65rem", letterSpacing: "-0.025em",
                          background: "linear-gradient(135deg,#FFFFFF 40%,rgba(196,181,253,0.9) 100%)",
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Forgot password?
                      </h2>
                      <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.85)" }}>
                        Enter your email and we'll send you a reset link.
                      </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}>
                        <AuthInput
                          label="Email address"
                          icon={Mail}
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 }}>
                        <CTAButton disabled={!email} isLoading={isLoading}>
                          {isLoading
                            ? <><div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />Sending…</>
                            : <>Send reset link <ArrowRight size={15} strokeWidth={2.5} /></>
                          }
                        </CTAButton>
                      </motion.div>
                    </form>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                      className="mt-5 flex items-center justify-center gap-1.5">
                      <ShieldCheck size={11} style={{ color: "rgba(74,222,128,0.85)" }} />
                      <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.75)" }}>
                        Secure · Encrypted · No spam
                      </span>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                      className="mt-5 text-center">
                      <Link to="/login" style={{ textDecoration: "none" }}>
                        <motion.span whileHover={{ x: -2 }}
                          className="inline-flex items-center gap-1.5 text-[13px]"
                          style={{ color: "rgba(148,163,184,0.75)", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.color = "rgba(203,213,225,0.95)"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(148,163,184,0.75)"}>
                          <ArrowLeft size={13} /> Back to sign in
                        </motion.span>
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
