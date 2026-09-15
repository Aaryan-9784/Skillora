import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Code2, Briefcase, Sparkles, CheckCircle2,
  ShieldCheck, Zap, Users, Kanban, FileText, ChevronRight, LogOut,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { GlassCard, CTAButton, CursorGlow } from "./_authShared";

// ── Left Column Feature Item (matches Register/Login) ──────────────────────
const Feature = ({ icon: Icon, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    className="flex items-center gap-3"
  >
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: "rgba(99,91,255,0.25)", border: "1px solid rgba(163,154,255,0.4)" }}
    >
      <Icon size={14} style={{ color: "#C4B5FD" }} />
    </div>
    <span
      className="text-[13px] font-semibold text-white"
      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}
    >
      {text}
    </span>
  </motion.div>
);

const Onboarding = () => {
  const [selectedRole, setSelectedRole] = useState("freelancer");
  const [submitting, setSubmitting] = useState(false);
  const { user, setRoleAndCompleteOnboarding, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedRole || submitting) return;
    setSubmitting(true);
    const res = await setRoleAndCompleteOnboarding(selectedRole);
    if (res.success) {
      if (selectedRole === "client") {
        navigate("/client/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      setSubmitting(false);
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  const freelancerFeatures = [
    { icon: Kanban, text: "Kanban board & milestone tracking" },
    { icon: Zap, text: "AI task breakdown & automated invoices" },
    { icon: FileText, text: "Zero commission on all contracts" },
    { icon: Users, text: "Real-time client chat & video calls" },
  ];

  const clientFeatures = [
    { icon: Briefcase, text: "Hire verified talent & post jobs" },
    { icon: ShieldCheck, text: "Milestone-based escrow payment security" },
    { icon: Kanban, text: "Real-time project oversight & reviews" },
    { icon: FileText, text: "Download invoices & financial statements" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#04070F" }}>

      {/* ── video background ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-85"
        style={{ filter: "brightness(0.55) contrast(1.15) saturate(1.1) blur(0.3px)" }}
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
        <source src="/videos/landing-bg.mp4" type="video/mp4" />
      </video>

      {/* ── overlay stack: dark on left for text, lighter on right ── */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.15)" }} />
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(to right, rgba(4,7,18,0.88) 0%, rgba(4,7,18,0.7) 40%, rgba(4,7,18,0.2) 70%, rgba(4,7,18,0.05) 100%)",
        }}
      />
      <div
        className="absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(to top, rgba(4,7,18,0.35) 0%, transparent 40%)" }}
      />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 85% at 20% 50%, rgba(4,7,18,0.75) 0%, transparent 85%)",
        }}
      />

      {/* ── animated mesh orbs ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none z-[1]"
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 700,
          height: 700,
          top: "-20%",
          left: "-15%",
          background: "radial-gradient(circle,rgba(99,91,255,0.1) 0%,transparent 65%)",
        }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none z-[1]"
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        style={{
          width: 500,
          height: 500,
          bottom: "-10%",
          right: "5%",
          background: "radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 65%)",
        }}
      />

      {/* ── brand glow ── */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 85% 50%,rgba(99,91,255,0.11) 0%,transparent 70%)",
        }}
      />

      {/* ── cursor glow ── */}
      <CursorGlow />

      {/* ── floating particles ── */}
      {[
        { top: "18%", left: "68%", s: 2, d: 0.3 },
        { top: "44%", left: "79%", s: 1.5, d: 1.4 },
        { top: "70%", left: "73%", s: 2, d: 0.9 },
        { top: "28%", left: "86%", s: 1.5, d: 2.2 },
        { top: "58%", left: "91%", s: 1, d: 1.8 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none z-[5]"
          style={{
            top: p.top,
            left: p.left,
            width: p.s,
            height: p.s,
            background: "rgba(167,139,250,0.5)",
          }}
          animate={{ y: [0, -12, 0], opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 5 + i * 0.8, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
        />
      ))}

      {/* ── 2-column layout (identical to Login / Register) ── */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_520px]">

        {/* ── LEFT COLUMN: Brand Hero ── */}
        <div className="hidden lg:flex flex-col justify-between px-16 py-14 select-none">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontFamily: "'Sora','Inter',sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "#fff",
                  lineHeight: 1,
                  cursor: "pointer",
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                }}
              >
                Skillora
              </span>
            </Link>
          </motion.div>

          <div className="space-y-10 max-w-[520px]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-[0.2em] uppercase border"
              style={{
                fontFamily: "'Sora', 'Inter', sans-serif",
                color: "#A78BFA",
                background: "rgba(139,92,246,0.1)",
                borderColor: "rgba(139,92,246,0.25)",
                textShadow: "0 2px 10px rgba(0,0,0,0.8)",
              }}
            >
              <Sparkles size={12} className="text-violet-400" />
              Step 2 of 2 • Workspace Setup
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
              style={{ cursor: "default" }}
            >
              <h1
                className="font-extrabold leading-[1.1] text-white"
                style={{
                  fontFamily: "'Sora', 'Inter', sans-serif",
                  fontSize: "clamp(2.4rem,3.5vw,3.2rem)",
                  letterSpacing: "-0.035em",
                  textShadow: "0 4px 16px rgba(0,0,0,0.9)",
                }}
              >
                How do you plan<br />to use{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#A78BFA 0%,#818CF8 50%,#38BDF8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 25px rgba(167,139,250,0.55))",
                  }}
                >
                  Skillora?
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.7] font-medium"
                style={{ color: "#94A3B8", maxWidth: "42ch", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}
              >
                {selectedRole === "freelancer"
                  ? "Your complete freelancer OS. Track projects, automate invoices with 0% commission, and scale your independent business."
                  : "Your enterprise-grade client portal. Post contracts, hire verified talent, and protect payments with milestone escrow."}
              </p>
            </motion.div>

            {/* Dynamic Features List */}
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
              style={{ cursor: "default" }}
            >
              {(selectedRole === "freelancer" ? freelancerFeatures : clientFeatures).map(
                (feat, idx) => (
                  <Feature
                    key={feat.text}
                    icon={feat.icon}
                    text={feat.text}
                    delay={0.35 + idx * 0.08}
                  />
                )
              )}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              whileHover={{ y: -3 }}
              className="inline-flex items-center gap-2.5"
              style={{ cursor: "default" }}
            >
              <div className="flex -space-x-1.5">
                {[
                  { initial: "A", bg: "linear-gradient(135deg,#635BFF,#8B5CF6)" },
                  { initial: "S", bg: "linear-gradient(135deg,#10B981,#059669)" },
                  { initial: "M", bg: "linear-gradient(135deg,#F59E0B,#D97706)" },
                  { initial: "K", bg: "linear-gradient(135deg,#00D4FF,#0284C7)" },
                ].map((a) => (
                  <div
                    key={a.initial}
                    className="w-5 h-5 rounded-full border border-black/40 flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0 select-none"
                    style={{ background: a.bg }}
                  >
                    {a.initial}
                  </div>
                ))}
              </div>
              <span
                className="text-[12px] font-medium"
                style={{ color: "#94A3B8", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
              >
                Trusted by{" "}
                <span
                  style={{
                    fontFamily: "'Sora', 'Inter', sans-serif",
                    color: "#C4B5FD",
                    fontWeight: 700,
                  }}
                >
                  10,000+
                </span>{" "}
                freelancers &amp; clients
              </span>
            </motion.div>
          </div>

          <motion.p
            className="text-[11px] font-medium"
            style={{ color: "#94A3B8", textShadow: "0 1px 6px rgba(0,0,0,0.8)", cursor: "default" }}
            whileHover={{ color: "rgba(203,213,225,0.9)", y: -1 }}
            transition={{ duration: 0.2 }}
          >
            © 2025 Skillora. All rights reserved.
          </motion.p>
        </div>

        {/* ── RIGHT COLUMN: Role Selection Card ── */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-10 lg:py-0">
          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[460px]"
          >
            {/* Mobile Logo */}
            <div className="mb-8 lg:hidden">
              <Link to="/" style={{ textDecoration: "none" }}>
                <span
                  style={{
                    fontFamily: "'Sora','Inter',sans-serif",
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "#fff",
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  Skillora
                </span>
              </Link>
            </div>

            <GlassCard className="!p-7 sm:!p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase border"
                    style={{
                      background: "rgba(99,91,255,0.12)",
                      borderColor: "rgba(139,92,246,0.3)",
                      color: "#C4B5FD",
                    }}
                  >
                    <Zap size={11} className="text-violet-400" />
                    Welcome aboard, {firstName}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Step 2 of 2</span>
                </div>

                <h2
                  className="font-extrabold text-white mb-1.5"
                  style={{
                    fontFamily: "'Sora', 'Inter', sans-serif",
                    fontSize: "1.65rem",
                    letterSpacing: "-0.03em",
                    background: "linear-gradient(135deg,#FFFFFF 30%,#C4B5FD 70%,#818CF8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Select your role
                </h2>
                <p className="text-[13px] font-medium leading-relaxed" style={{ color: "#94A3B8" }}>
                  Choose your account type to configure your workspace navigation, tools, and widgets.
                </p>
              </motion.div>

              {/* Role Cards */}
              <div className="space-y-3.5 mb-6">

                {/* 1. Freelancer Option */}
                <motion.div
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedRole("freelancer")}
                  className="relative p-4 sm:p-4.5 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
                  style={{
                    background:
                      selectedRole === "freelancer"
                        ? "linear-gradient(145deg, rgba(99,91,255,0.18) 0%, rgba(15,20,40,0.85) 100%)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      selectedRole === "freelancer"
                        ? "1px solid rgba(139,92,246,0.8)"
                        : "1px solid rgba(255,255,255,0.12)",
                    boxShadow:
                      selectedRole === "freelancer"
                        ? "0 0 24px rgba(99,91,255,0.22), inset 0 1px 0 rgba(255,255,255,0.15)"
                        : "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  {selectedRole === "freelancer" && (
                    <div
                      className="absolute top-0 inset-x-0 h-px pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(167,139,250,0.9), transparent)",
                      }}
                    />
                  )}

                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300"
                      style={{
                        background:
                          selectedRole === "freelancer"
                            ? "linear-gradient(135deg, #635BFF 0%, #818CF8 100%)"
                            : "rgba(255,255,255,0.07)",
                        boxShadow:
                          selectedRole === "freelancer"
                            ? "0 4px 16px rgba(99,91,255,0.4)"
                            : "none",
                      }}
                    >
                      <Code2
                        size={20}
                        className={selectedRole === "freelancer" ? "text-white" : "text-slate-400"}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[14.5px] font-bold text-white tracking-tight"
                          style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
                        >
                          I'm a Freelancer / Pro
                        </span>
                        <span
                          className="text-[9.5px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            background: "rgba(99,91,255,0.2)",
                            color: "#C4B5FD",
                            border: "1px solid rgba(139,92,246,0.3)",
                          }}
                        >
                          Talent
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-400 font-medium">
                        Manage client projects, send invoices &amp; keep 100% of your earnings.
                      </p>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all"
                      style={{
                        background:
                          selectedRole === "freelancer"
                            ? "linear-gradient(135deg,#3B82F6,#8B5CF6)"
                            : "transparent",
                        border:
                          selectedRole === "freelancer"
                            ? "none"
                            : "1.5px solid rgba(255,255,255,0.25)",
                        boxShadow:
                          selectedRole === "freelancer"
                            ? "0 0 12px rgba(139,92,246,0.6)"
                            : "none",
                      }}
                    >
                      {selectedRole === "freelancer" && (
                        <Check size={12} strokeWidth={3} className="text-white" />
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* 2. Client Option */}
                <motion.div
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedRole("client")}
                  className="relative p-4 sm:p-4.5 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
                  style={{
                    background:
                      selectedRole === "client"
                        ? "linear-gradient(145deg, rgba(236,72,153,0.18) 0%, rgba(15,20,40,0.85) 100%)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      selectedRole === "client"
                        ? "1px solid rgba(236,72,153,0.8)"
                        : "1px solid rgba(255,255,255,0.12)",
                    boxShadow:
                      selectedRole === "client"
                        ? "0 0 24px rgba(236,72,153,0.22), inset 0 1px 0 rgba(255,255,255,0.15)"
                        : "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  {selectedRole === "client" && (
                    <div
                      className="absolute top-0 inset-x-0 h-px pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(244,114,182,0.9), transparent)",
                      }}
                    />
                  )}

                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300"
                      style={{
                        background:
                          selectedRole === "client"
                            ? "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)"
                            : "rgba(255,255,255,0.07)",
                        boxShadow:
                          selectedRole === "client"
                            ? "0 4px 16px rgba(236,72,153,0.4)"
                            : "none",
                      }}
                    >
                      <Briefcase
                        size={20}
                        className={selectedRole === "client" ? "text-white" : "text-slate-400"}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[14.5px] font-bold text-white tracking-tight"
                          style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
                        >
                          I'm a Client / Business
                        </span>
                        <span
                          className="text-[9.5px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            background: "rgba(236,72,153,0.2)",
                            color: "#F472B6",
                            border: "1px solid rgba(236,72,153,0.3)",
                          }}
                        >
                          Employer
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-400 font-medium">
                        Hire vetted talent, manage deliverables &amp; secure payments with escrow.
                      </p>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all"
                      style={{
                        background:
                          selectedRole === "client"
                            ? "linear-gradient(135deg,#EC4899,#F43F5E)"
                            : "transparent",
                        border:
                          selectedRole === "client"
                            ? "none"
                            : "1.5px solid rgba(255,255,255,0.25)",
                        boxShadow:
                          selectedRole === "client"
                            ? "0 0 12px rgba(236,72,153,0.6)"
                            : "none",
                      }}
                    >
                      {selectedRole === "client" && (
                        <Check size={12} strokeWidth={3} className="text-white" />
                      )}
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Action Button */}
              <CTAButton
                disabled={submitting}
                isLoading={submitting}
                onClick={handleContinue}
                type="button"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-[1.5px] border-white/25 border-t-white rounded-full animate-spin" />
                    <span>Configuring workspace…</span>
                  </>
                ) : (
                  <>
                    <span>
                      Continue to {selectedRole === "client" ? "Client Portal" : "Freelancer Dashboard"}
                    </span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </>
                )}
              </CTAButton>

              {/* Bottom helpers */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col items-center gap-2.5 text-center">
                <p className="text-[11px] font-medium text-slate-400">
                  You can also switch or update your role anytime in settings.
                </p>

                {user?.email && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>Signed in as <span className="text-slate-300">{user.email}</span></span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => logout?.()}
                      className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>

            </GlassCard>
          </motion.div>
        </div>

      </div>

    </div>
  );
};

export default Onboarding;

