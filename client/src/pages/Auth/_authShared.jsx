import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Github } from "lucide-react";

// ─── Google icon ───────────────────────────────────────────────────────────
export const GoogleIcon = () => (
  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─── Premium glass input ───────────────────────────────────────────────────
export const AuthInput = ({ label, icon: Icon, error, suffix, labelRight, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="block text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: "rgba(203,213,225,0.85)" }}>
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}
      <div className="relative flex items-center rounded-2xl transition-all duration-300"
        style={{
          background: focused
            ? "rgba(255,255,255,0.12)"
            : "rgba(255,255,255,0.08)",
          border: error
            ? "1px solid rgba(239,68,68,0.5)"
            : focused
            ? "1px solid rgba(99,91,255,0.65)"
            : "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(16px)",
          boxShadow: focused && !error
            ? "0 0 0 3px rgba(99,91,255,0.12), 0 2px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
        {/* focus top glow line */}
        <AnimatePresence>
          {focused && !error && (
            <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              className="absolute top-0 inset-x-0 h-px rounded-t-2xl pointer-events-none"
              style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.8),rgba(139,92,246,0.6),transparent)" }} />
          )}
        </AnimatePresence>
        {Icon && (
          <div className="pl-4 shrink-0">
            <Icon size={13} style={{ color: focused ? "rgba(167,139,250,1)" : "rgba(148,163,184,0.8)", transition: "color 0.3s" }} />
          </div>
        )}
        <input {...props}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
          className="flex-1 bg-transparent px-3.5 py-3.5 text-[13px] outline-none placeholder-shown:opacity-100"
          style={{
            color: "#F1F5F9",
            caretColor: "#818CF8",
            letterSpacing: "0.01em",
          }}
        />
        {suffix && <div className="pr-4 shrink-0">{suffix}</div>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(248,113,113,0.95)" }}>
            <AlertCircle size={10} />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Glass role toggle with sliding pill ──────────────────────────────────
export const RoleToggle = ({ value, onChange, options }) => {
  const activeIdx = options.findIndex(o => o.value === value);
  return (
    <div className="relative flex p-1 rounded-2xl mb-6"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(16px)",
      }}>
      {/* sliding gradient pill */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-xl pointer-events-none"
        animate={{ left: `calc(${activeIdx * 50}% + 4px)`, width: "calc(50% - 4px)" }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        style={{
          background: "linear-gradient(135deg,#3B82F6 0%,#8B5CF6 60%,#EC4899 100%)",
          boxShadow: "0 0 20px rgba(139,92,246,0.5), 0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      />
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className="relative flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 z-10"
          style={{ color: value === opt.value ? "#fff" : "rgba(203,213,225,0.8)" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ─── OAuth buttons ─────────────────────────────────────────────────────────
export const OAuthButtons = ({ apiBase, role = "freelancer", label = "or sign in with" }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(255,255,255,0.2),transparent)" }} />
      <span className="text-[11px] tracking-[0.06em] shrink-0" style={{ color: "rgba(203,213,225,0.7)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left,transparent,rgba(255,255,255,0.2),transparent)" }} />
    </div>
    <div className="grid grid-cols-2 gap-2.5">
      {[
        {
          href: `${apiBase}/api/auth/google?role=${role}`,
          icon: <GoogleIcon />,
          label: "Google",
          accent: "rgba(66,133,244,0.22)",
          border: "rgba(66,133,244,0.45)",
          glow: "rgba(66,133,244,0.2)",
          textColor: "#93C5FD",
        },
        {
          href: `${apiBase}/api/auth/github?role=${role}`,
          icon: <Github size={15} />,
          label: "GitHub",
          accent: "rgba(255,255,255,0.14)",
          border: "rgba(255,255,255,0.3)",
          glow: "rgba(255,255,255,0.1)",
          textColor: "#F1F5F9",
        },
      ].map(({ href, icon, label, accent, border, glow, textColor }) => (
        <motion.a
          key={label}
          href={href}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex items-center justify-center gap-2.5 h-11 rounded-2xl text-[13px] font-semibold overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(16px)",
            color: "rgba(226,232,240,0.95)",
            textDecoration: "none",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = accent;
            e.currentTarget.style.border = `1px solid ${border}`;
            e.currentTarget.style.boxShadow = `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.12)`;
            e.currentTarget.style.color = textColor;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.09)";
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.2)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.color = "rgba(226,232,240,0.95)";
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)" }} />
          {icon}
          <span>{label}</span>
        </motion.a>
      ))}
    </div>
  </div>
);

// ─── Cursor-following radial glow ──────────────────────────────────────────
export const CursorGlow = () => {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const h = e => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[3] overflow-hidden"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(99,91,255,0.06) 0%, transparent 60%)`,
        transition: "background 0.1s ease",
      }} />
  );
};

// ─── Animated mesh background ──────────────────────────────────────────────
export const MeshBg = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0" style={{ background: "#04070F" }} />
    <motion.div className="absolute rounded-full"
      animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: 700, height: 700, top: "-20%", left: "-15%",
        background: "radial-gradient(circle,rgba(99,91,255,0.12) 0%,transparent 65%)" }} />
    <motion.div className="absolute rounded-full"
      animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      style={{ width: 600, height: 600, bottom: "-15%", right: "-10%",
        background: "radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 65%)" }} />
    <motion.div className="absolute rounded-full"
      animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      style={{ width: 400, height: 400, top: "30%", left: "40%",
        background: "radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 65%)" }} />
  </div>
);

// ─── Premium glass card ────────────────────────────────────────────────────
export const GlassCard = ({ children, className = "" }) => (
  <div className={"relative rounded-3xl overflow-hidden " + className}
    style={{
      background: "linear-gradient(145deg,rgba(15,20,40,0.72) 0%,rgba(10,14,30,0.65) 50%,rgba(15,20,40,0.7) 100%)",
      border: "1px solid rgba(255,255,255,0.16)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      boxShadow: [
        "0 0 0 1px rgba(99,91,255,0.15)",
        "0 32px 80px rgba(0,0,0,0.35)",
        "0 0 60px rgba(99,91,255,0.08)",
        "inset 0 1px 0 rgba(255,255,255,0.15)",
        "inset 0 -1px 0 rgba(0,0,0,0.12)",
      ].join(", "),
      padding: "44px 40px",
    }}>
    {/* top accent line */}
    <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
      style={{ background: "linear-gradient(90deg,transparent 5%,rgba(99,91,255,0.75) 38%,rgba(56,189,248,0.45) 62%,transparent 95%)" }} />
    {/* inner light reflection */}
    <div className="absolute top-0 inset-x-0 h-[120px] pointer-events-none rounded-t-3xl"
      style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 100%)" }} />
    {/* corner glows */}
    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle,rgba(99,91,255,0.14) 0%,transparent 70%)" }} />
    <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 70%)" }} />
    <div className="relative">{children}</div>
  </div>
);

// ─── CTA button ────────────────────────────────────────────────────────────
export const CTAButton = ({ children, disabled, isLoading, onClick, type = "submit" }) => (
  <motion.button type={type} disabled={disabled || isLoading}
    whileHover={!disabled && !isLoading ? { scale: 1.025, y: -2 } : {}}
    whileTap={!disabled && !isLoading ? { scale: 0.975 } : {}}
    onClick={onClick}
    className="relative w-full h-[52px] rounded-2xl flex items-center justify-center gap-2
               text-[14px] font-semibold overflow-hidden"
    style={{
      background: !disabled && !isLoading
        ? "linear-gradient(135deg,#3B82F6 0%,#8B5CF6 50%,#EC4899 100%)"
        : "rgba(255,255,255,0.08)",
      boxShadow: !disabled && !isLoading
        ? "0 0 0 1px rgba(139,92,246,0.4),0 8px 32px rgba(99,91,255,0.45),inset 0 1px 0 rgba(255,255,255,0.18)"
        : "inset 0 1px 0 rgba(255,255,255,0.06)",
      color: !disabled && !isLoading ? "#fff" : "rgba(148,163,184,0.6)",
      cursor: disabled || isLoading ? "not-allowed" : "pointer",
      transition: "all 0.3s ease",
      backdropFilter: "blur(8px)",
      border: disabled || isLoading ? "1px solid rgba(255,255,255,0.1)" : "none",
    }}>
    {!disabled && !isLoading && (
      <>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.14) 50%,transparent 70%)", backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["200% 0","−200% 0"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }} />
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)" }} />
      </>
    )}
    {children}
  </motion.button>
);
