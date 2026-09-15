import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, CheckCircle2, ArrowRight, Shield, Zap,
  Briefcase, Code2, Users, FileText, ChevronRight, Check
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const FREELANCER_PERKS = [
  "Create & manage projects with Kanban board",
  "Send professional invoices & receive instant payments",
  "Build rich developer profile & showcase portfolio",
  "Built-in AI Assistant for task breakdown & rate calculation",
  "Direct real-time chat, voice notes & HD video calling"
];

const CLIENT_PERKS = [
  "Post project requirements & hire verified freelancers",
  "Deposit funds in secure escrow protection",
  "Review milestone deliverables before releasing payouts",
  "Real-time team chat, file sharing & WebRTC video calls",
  "Download invoices, receipts & financial statements"
];

const Onboarding = () => {
  const [selectedRole, setSelectedRole] = useState("freelancer");
  const [submitting, setSubmitting] = useState(false);
  const { user, setRoleAndCompleteOnboarding } = useAuthStore();
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

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden text-slate-100"
         style={{ background: "#04070F" }}>
      
      {/* Background looping video matches theme */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-60 pointer-events-none"
        style={{ filter: "brightness(0.4) contrast(1.15) saturate(1.1) blur(1px)" }}
      >
        <source src="/videos/landing-bg.mp4" type="video/mp4" />
      </video>

      {/* Atmospheric dark gradient overlays */}
      <div className="absolute inset-0 z-[1] pointer-events-none" 
           style={{ background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99, 91, 255, 0.15) 0%, rgba(4, 7, 15, 0.95) 75%)" }} />
      <div className="absolute inset-0 z-[1] pointer-events-none"
           style={{ background: "linear-gradient(to bottom, rgba(4,7,15,0.7) 0%, rgba(4,7,15,0.95) 100%)" }} />

      {/* Top Brand Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-lg"
               style={{ background: "linear-gradient(135deg, #635BFF 0%, #38BDF8 100%)", boxShadow: "0 0 20px rgba(99,91,255,0.4)" }}>
            S
          </div>
          <span style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}
                className="text-white">
            Skillora
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs text-slate-300">
          <Sparkles size={13} className="text-violet-400 animate-pulse" />
          <span>Step 2 of 2: Workspace Setup</span>
        </div>
      </header>

      {/* Center Body */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex-1 flex flex-col items-center justify-center">
        
        {/* Title & Welcome */}
        <div className="text-center max-w-2xl mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 text-indigo-300 bg-indigo-500/10 border border-indigo-500/20"
          >
            <Zap size={13} /> Welcome aboard, {firstName}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3"
            style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
          >
            How do you plan to use <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">Skillora</span>?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base font-normal max-w-lg mx-auto"
          >
            Select your account type. We will configure your workspace, tools, and navigation tailored to your daily workflow.
          </motion.p>
        </div>

        {/* 2 Role Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          
          {/* CARD 1: Freelancer */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedRole("freelancer")}
            className={`group relative rounded-3xl p-7 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
              selectedRole === "freelancer"
                ? "bg-slate-900/90 border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,91,255,0.25)] ring-1 ring-indigo-400/40"
                : "bg-slate-900/40 border border-white/10 hover:border-white/20 hover:bg-slate-900/60 shadow-xl"
            }`}
            style={{ backdropFilter: "blur(20px)" }}
          >
            {/* Active Selection Badge */}
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                   style={{
                     background: selectedRole === "freelancer" 
                       ? "linear-gradient(135deg, #635BFF 0%, #818CF8 100%)" 
                       : "rgba(255,255,255,0.06)",
                     boxShadow: selectedRole === "freelancer" ? "0 4px 20px rgba(99,91,255,0.4)" : "none"
                   }}>
                <Code2 size={26} className={selectedRole === "freelancer" ? "text-white" : "text-slate-400"} />
              </div>

              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                selectedRole === "freelancer"
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/50 scale-110"
                  : "border-2 border-slate-600 group-hover:border-slate-400"
              }`}>
                {selectedRole === "freelancer" && <Check size={16} strokeWidth={3} />}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                  I'm a Freelancer / Pro
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Talent
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                I want to manage client projects, track tasks, send automated invoices, and get paid with 0% commission.
              </p>

              {/* Perk checklist */}
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                {FREELANCER_PERKS.map((perk, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                    <CheckCircle2 size={15} className={selectedRole === "freelancer" ? "text-indigo-400 shrink-0 mt-0.5" : "text-slate-500 shrink-0 mt-0.5"} />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <div className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                selectedRole === "freelancer" ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-400"
              }`}>
                <span>Freelancer Dashboard & Tools</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>

          {/* CARD 2: Client */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedRole("client")}
            className={`group relative rounded-3xl p-7 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
              selectedRole === "client"
                ? "bg-slate-900/90 border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.25)] ring-1 ring-pink-400/40"
                : "bg-slate-900/40 border border-white/10 hover:border-white/20 hover:bg-slate-900/60 shadow-xl"
            }`}
            style={{ backdropFilter: "blur(20px)" }}
          >
            {/* Active Selection Badge */}
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                   style={{
                     background: selectedRole === "client" 
                       ? "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)" 
                       : "rgba(255,255,255,0.06)",
                     boxShadow: selectedRole === "client" ? "0 4px 20px rgba(236,72,153,0.4)" : "none"
                   }}>
                <Briefcase size={26} className={selectedRole === "client" ? "text-white" : "text-slate-400"} />
              </div>

              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                selectedRole === "client"
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/50 scale-110"
                  : "border-2 border-slate-600 group-hover:border-slate-400"
              }`}>
                {selectedRole === "client" && <Check size={16} strokeWidth={3} />}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                  I'm a Client / Business
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Employer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                I want to hire top freelancers, manage projects, protect payments with escrow, and approve deliverables.
              </p>

              {/* Perk checklist */}
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                {CLIENT_PERKS.map((perk, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                    <CheckCircle2 size={15} className={selectedRole === "client" ? "text-pink-400 shrink-0 mt-0.5" : "text-slate-500 shrink-0 mt-0.5"} />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <div className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                selectedRole === "client" ? "text-pink-300" : "text-slate-500 group-hover:text-slate-400"
              }`}>
                <span>Client Portal & Escrow Controls</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>

        </div>

        {/* CTA Launch Button */}
        <div className="w-full max-w-md mt-10 flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            disabled={submitting}
            className="w-full py-4 px-8 rounded-2xl font-bold text-sm tracking-wide text-white flex items-center justify-center gap-2 shadow-2xl transition-all disabled:opacity-50 cursor-pointer"
            style={{
              background: selectedRole === "client"
                ? "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)"
                : "linear-gradient(135deg, #635BFF 0%, #38BDF8 100%)",
              boxShadow: selectedRole === "client"
                ? "0 10px 30px -5px rgba(236,72,153,0.4)"
                : "0 10px 30px -5px rgba(99,91,255,0.4)",
            }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Configuring your workspace...</span>
              </>
            ) : (
              <>
                <span>Continue to {selectedRole === "client" ? "Client Portal" : "Freelancer Dashboard"}</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </motion.button>

          <p className="text-[11px] text-slate-500 text-center font-medium">
            You can also switch or update your role anytime from your account settings.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-500">
        © 2025 Skillora Technologies Inc. All rights reserved.
      </footer>

    </div>
  );
};

export default Onboarding;
