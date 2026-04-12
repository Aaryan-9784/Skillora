/**
 * _authShared.jsx — Luxury shared primitives for Login & Register.
 *
 * Design: Apple × Stripe × Linear — calm, premium, cinematic.
 * Layout: Full-screen bg image, RIGHT-side floating form.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Github } from "lucide-react";

// ─────────────────────────────────────────────────────────
// BACKGROUND IMAGES
// Register: premium dark workspace with warm desk lighting
// Login:    neon dual-monitor setup (unchanged)
// ─────────────────────────────────────────────────────────
export const BG_LOGIN =
  "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1920&q=90&auto=format&fit=crop";
// "Dark neon workstation" — Fotis Fotopoulos, Unsplash free license

export const BG_REGISTER =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=90&auto=format&fit=crop";
// "Team working at modern desk" — Brooke Cagle, Unsplash free license
// Warm, professional, collaborative — perfect for a signup page

// Keep BG_IMAGE as alias so Login import doesn't break
export const BG_IMAGE = BG_LOGIN;

// ─────────────────────────────────────────────────────────
// LUXURY AUTH INPUT
// ─────────────────────────────────────────────────────────
export const AuthInput = ({ label, icon: Icon, error, suffix, labelRight, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="block text-[10px] font-semibold tracking-[0.18em] uppercase"
              style={{ color: "rgba(148,163,184,0.55)" }}>
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}

      <div className="relative flex items-center rounded-2xl transition-all duration-300"
        style={{
          background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: error
            ? "1px solid rgba(239,68,68,0.4)"
            : focused
            ? "1px solid rgba(99,91,255,0.5)"
            : "1px solid rgba(255,255,255,0.07)",
          boxShadow: focused && !error
            ? "0 0 0 4px rgba(99,91,255,0.08), 0 2px 16px rgba(0,0,0,0.12)"
            : "none",
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}>

        {focused && !error && (
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            className="absolute top-0 inset-x-0 h-px rounded-t-2xl pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(139,92,246,0.4),transparent)" }}
          />
        )}

        {Icon && (
          <div className="pl-4 shrink-0">
            <Icon size={13}
              style={{ color: focused ? "rgba(129,140,248,0.8)" : "rgba(75,85,99,0.7)", transition: "color 0.3s" }} />
          </div>
        )}

        <input
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          className="flex-1 bg-transparent px-3.5 py-3.5 text-sm outline-none"
          style={{ color: "#F1F5F9", caretColor: "#818CF8", letterSpacing: "0.01em" }}
        />

        {suffix && <div className="pr-4 shrink-0">{suffix}</div>}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "rgba(248,113,113,0.9)" }}>
            <AlertCircle size={10} />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// GOOGLE ICON
// ─────────────────────────────────────────────────────────
export const GoogleIcon = () => (
  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────
// OAUTH BUTTONS
// ─────────────────────────────────────────────────────────
export const OAuthButtons = ({ apiBase }) => (
  <div className="grid grid-cols-2 gap-2.5">
    {[
      { href: `${apiBase}/api/auth/google`, icon: <GoogleIcon />, label: "Google",
        hoverBg: "rgba(66,133,244,0.08)", hoverBorder: "rgba(66,133,244,0.35)" },
      { href: `${apiBase}/api/auth/github`, icon: <Github size={14} />, label: "GitHub",
        hoverBg: "rgba(255,255,255,0.06)", hoverBorder: "rgba(255,255,255,0.18)" },
    ].map(({ href, icon, label, hoverBg, hoverBorder }) => (
      <a key={label} href={href}
        className="flex items-center justify-center gap-2 h-11 rounded-2xl text-[13px] font-medium"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(226,232,240,0.85)",
          textDecoration: "none",
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = hoverBg;
          e.currentTarget.style.border = `1px solid ${hoverBorder}`;
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
          e.currentTarget.style.color = "#F1F5F9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.color = "rgba(226,232,240,0.85)";
        }}>
        {icon}{label}
      </a>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────
// LUXURY GLASS CARD
// ─────────────────────────────────────────────────────────
export const GlassCard = ({ children }) => (
  <div className="relative rounded-3xl overflow-hidden"
    style={{
      background: "linear-gradient(160deg, rgba(10,14,32,0.82) 0%, rgba(6,9,22,0.88) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      boxShadow: [
        "0 0 0 1px rgba(99,91,255,0.06)",
        "0 32px 80px rgba(0,0,0,0.75)",
        "0 0 60px rgba(99,91,255,0.05)",
        "inset 0 1px 0 rgba(255,255,255,0.06)",
      ].join(", "),
      padding: "44px 40px",
    }}>
    <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
      style={{ background: "linear-gradient(90deg,transparent 10%,rgba(99,91,255,0.45) 40%,rgba(139,92,246,0.3) 60%,transparent 90%)" }} />
    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle,rgba(99,91,255,0.08) 0%,transparent 70%)" }} />
    <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle,rgba(56,189,248,0.04) 0%,transparent 70%)" }} />
    <div className="relative">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────
// AUTH PAGE SHELL — luxury full-screen bg, RIGHT-form layout
// ─────────────────────────────────────────────────────────
export const AuthPageShell = ({ children, bgImage }) => {
  const image = bgImage || BG_LOGIN;
  return (
  <div className="relative min-h-screen flex items-stretch overflow-hidden">

    {/* Background image — slow Ken Burns */}
    <motion.div
      className="absolute inset-0 z-0"
      initial={{ scale: 1 }}
      animate={{ scale: 1.05 }}
      transition={{ duration: 24, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
      style={{
        backgroundImage: `url("${image}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 35%",
      }}
    />

    {/* Overlay stack */}
    {/* 1. Base tint */}
    <div className="absolute inset-0 z-[1]" style={{ background: "rgba(4,7,18,0.58)" }} />
    {/* 2. Right-heavy gradient — left shows image, right darker for form */}
    <div className="absolute inset-0 z-[2]"
      style={{ background: "linear-gradient(to left, rgba(4,7,18,0.96) 0%, rgba(4,7,18,0.75) 32%, rgba(4,7,18,0.30) 62%, rgba(4,7,18,0.06) 100%)" }} />
    {/* 3. Bottom vignette */}
    <div className="absolute inset-0 z-[3]"
      style={{ background: "linear-gradient(to top, rgba(4,7,18,0.90) 0%, transparent 45%)" }} />
    {/* 4. Top vignette */}
    <div className="absolute inset-0 z-[3]"
      style={{ background: "linear-gradient(to bottom, rgba(4,7,18,0.60) 0%, transparent 24%)" }} />
    {/* 5. Edge vignette */}
    <div className="absolute inset-0 z-[3]"
      style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 52%, rgba(4,7,18,0.60) 100%)" }} />
    {/* 6. Brand glow — right side behind form */}
    <div className="absolute inset-0 z-[4] pointer-events-none"
      style={{ background: "radial-gradient(ellipse 48% 60% at 90% 52%, rgba(99,91,255,0.11) 0%, transparent 70%)" }} />
    {/* 7. Soft blue accent — left/center */}
    <div className="absolute inset-0 z-[4] pointer-events-none"
      style={{ background: "radial-gradient(ellipse 50% 45% at 30% 40%, rgba(56,189,248,0.05) 0%, transparent 70%)" }} />

    {/* Subtle particles — right side only */}
    {[
      { top: "22%", left: "70%", s: 2,   d: 0.5 },
      { top: "48%", left: "80%", s: 1.5, d: 1.6 },
      { top: "68%", left: "74%", s: 2,   d: 1.0 },
      { top: "32%", left: "87%", s: 1.5, d: 2.4 },
    ].map((p, i) => (
      <motion.div key={i}
        className="absolute rounded-full pointer-events-none z-[5]"
        style={{ top: p.top, left: p.left, width: p.s, height: p.s, background: "rgba(167,139,250,0.45)" }}
        animate={{ y: [0, -10, 0], opacity: [0.12, 0.45, 0.12] }}
        transition={{ duration: 5.5 + i * 0.7, repeat: Infinity, delay: p.d, ease: "easeInOut" }}
      />
    ))}

    {/* Content */}
    <div className="relative z-10 flex w-full min-h-screen">
      {children}
    </div>
  </div>
  );
};
