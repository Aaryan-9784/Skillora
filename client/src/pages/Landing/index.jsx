import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Zap, LayoutDashboard, Users, CreditCard, Brain, CheckCircle2,
  ArrowRight, Star, TrendingUp, Shield, Clock, Globe,
  ChevronRight, Play, BarChart3, FileText, Kanban, Bot, X,
  MessageSquarePlus, Send, User, LogOut, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import useClickOutside from "../../hooks/useClickOutside";
import { getInitials } from "../../utils/helpers";

// ─── Reusable fade-in wrapper ─────────────────────────────
const FadeIn = ({ children, delay = 0, y = 20, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Animated counter ─────────────────────────────────────
const Counter = ({ to, suffix = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ─── Cursor glow ──────────────────────────────────────────
const CursorGlow = () => {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(139,92,246,0.08), transparent 40%)`,
      }}
    />
  );
};

// ─── Navbar ───────────────────────────────────────────────
const NavLink = ({ href, children }) => (
  <a
    href={href}
    className="group relative text-[14px] font-semibold transition-colors duration-300 tracking-wide"
    style={{
      color: "#fff",
      textShadow: "0 1px 10px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.8)",
    }}
    onMouseEnter={e => e.currentTarget.style.color = "#C084FC"}
    onMouseLeave={e => e.currentTarget.style.color = "#fff"}
  >
    {children}
    <span className="absolute -bottom-1 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300 rounded-full"
      style={{ background: "linear-gradient(90deg,#3B82F6,#8B5CF6,#EC4899)" }} />
  </a>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuthStore();

  useClickOutside(dropdownRef, () => setDropdownOpen(false), { enabled: dropdownOpen });

  const dashboardPath = user?.role === "admin"
    ? "/admin"
    : user?.role === "client"
    ? "/client/dashboard"
    : "/dashboard";

  const profilePath = user?.role === "admin"
    ? "/admin/profile"
    : user?.role === "client"
    ? "/client/profile"
    : "/profile";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const links = [
    { label: "Product",      href: "#product" },
    { label: "Features",     href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Why Skillora", href: "#why-skillora" },
    { label: "Reviews",      href: "#reviews" },
  ];

  return (
    <>
      {/* ── Top glow line ── */}
      <div className="fixed top-0 inset-x-0 z-50 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg,transparent 0%,rgba(99,91,255,0.6) 30%,rgba(0,212,255,0.4) 60%,transparent 100%)" }} />

      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-40 h-[76px] px-6 sm:px-10 lg:px-14 flex items-center justify-between transition-all duration-300"
        style={{
          background: scrolled ? "rgba(8,11,22,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* ── Logo — left ── */}
        <div className="flex items-center">
          <Link to="/" style={{ textDecoration: "none" }}>
            <motion.span
              whileHover={{ filter: "drop-shadow(0 0 12px rgba(99,91,255,0.7))" }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: "'Sora','Inter',sans-serif",
                fontSize: 27,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#fff",
                cursor: "pointer",
                display: "block",
                textShadow: "0 2px 10px rgba(0,0,0,0.95)",
              }}
            >
              Skillora
            </motion.span>
          </Link>
        </div>

        {/* ── Desktop nav links — center ── */}
        <div className="hidden md:flex items-center justify-center gap-7 lg:gap-9">
          {links.map((l) => (
            <NavLink key={l.label} href={l.href}>{l.label}</NavLink>
          ))}
        </div>

        {/* ── Desktop right actions — right ── */}
        <div className="hidden md:flex items-center justify-end gap-6">
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-150 group cursor-pointer"
                style={{
                  background: "rgba(8, 12, 24, 0.75)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
              >
                <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: user?.avatar ? "transparent" : "linear-gradient(135deg,#635BFF,#8579FF)",
                    boxShadow: "0 0 12px rgba(99,91,255,0.5)"
                  }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    getInitials(user?.name)
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080B16]"
                    style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                </div>
                <div className="flex flex-col justify-center text-left py-0.5">
                  <p className="text-xs font-bold text-white group-hover:text-purple-200 transition-colors leading-tight truncate max-w-[120px]"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                    {user?.name}
                  </p>
                  <p className="text-[11px] font-semibold capitalize leading-tight mt-0.5"
                    style={{ color: "#C4B5FD", textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                    {user?.role || "user"}
                  </p>
                </div>
                <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-0.5">
                  <ChevronDown size={14} className="text-gray-300 group-hover:text-white transition-colors" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(160deg,rgba(12,19,36,0.98) 0%,rgba(8,14,26,0.98) 100%)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 0 0 1px rgba(99,91,255,0.1), 0 20px 48px rgba(0,0,0,0.65)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />
                    <div className="py-2 px-2 space-y-1">
                      <Link to={dashboardPath} onClick={() => setDropdownOpen(false)}>
                        <motion.div
                          whileHover={{ x: 2 }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#F9FAFB"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                        >
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
                            <LayoutDashboard size={13} className="text-purple-400" />
                          </div>
                          <span className="font-medium">Dashboard</span>
                        </motion.div>
                      </Link>
                      <Link to={profilePath} onClick={() => setDropdownOpen(false)}>
                        <motion.div
                          whileHover={{ x: 2 }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#F9FAFB"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                        >
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <User size={13} />
                          </div>
                          <span className="font-medium">Profile</span>
                        </motion.div>
                      </Link>
                    </div>
                    <div className="px-2 pb-2 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <motion.button
                        whileHover={{ x: 2 }}
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 transition-all duration-150 cursor-pointer"
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <LogOut size={13} className="text-red-400" />
                        </div>
                        <span className="font-medium">Sign out</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login">
                <motion.span
                  whileHover={{ color: "#C084FC" }}
                  className="text-[14px] font-semibold cursor-pointer transition-colors duration-200"
                  style={{
                    color: "#fff",
                    textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)",
                  }}
                >
                  Sign in
                </motion.span>
              </Link>

              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(139,92,246,0.6)" }}
                  whileTap={{ scale: 0.96 }}
                  className="relative h-10 px-6 rounded-full text-[14px] font-semibold text-white flex items-center gap-2 overflow-hidden cursor-pointer"
                  style={{
                    background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 45%, #EC4899 100%)",
                    boxShadow: "0 4px 18px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                    letterSpacing: "0.01em",
                  }}
                >
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />
                  Get started
                  <ArrowRight size={14} strokeWidth={2.5} />
                </motion.button>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger — right ── */}
        <div className="md:hidden flex justify-end">
        <motion.button
          className="flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={() => setMenuOpen((o) => !o)}
          whileTap={{ scale: 0.93 }}
          aria-label="Toggle menu"
        >
          <motion.span animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25 }} className="block w-4 h-px rounded-full bg-white" />
          <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.2 }} className="block w-4 h-px rounded-full bg-white" />
          <motion.span animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25 }} className="block w-4 h-px rounded-full bg-white" />
        </motion.button>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 md:hidden"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-40 w-72 md:hidden flex flex-col"
              style={{
                background: "rgba(8,11,22,0.97)",
                backdropFilter: "blur(24px)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 h-16"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontFamily: "'Sora','Inter',sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>
                  Skillora
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="rgba(148,163,184,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </motion.button>
              </div>

              {/* Drawer links */}
              <div className="flex flex-col px-4 py-6 gap-1 flex-1">
                {links.map((l, i) => (
                  <motion.a
                    key={l.label}
                    href={l.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200"
                    style={{ color: "rgba(148,163,184,0.85)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(148,163,184,0.85)"; }}
                  >
                    {l.label}
                  </motion.a>
                ))}
              </div>

              {/* Drawer footer CTAs */}
              <div className="px-4 pb-8 flex flex-col gap-3">
                {isAuthenticated && user ? (
                  <Link to={dashboardPath} onClick={() => setMenuOpen(false)}>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="w-full h-11 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899)", boxShadow: "0 0 20px rgba(139,92,246,0.35)" }}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden bg-white/20">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          getInitials(user?.name)
                        )}
                      </div>
                      <span>Go to Dashboard</span>
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </motion.button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="w-full h-11 rounded-xl text-[14px] font-medium"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(203,213,225,0.85)" }}
                      >
                        Sign in
                      </motion.button>
                    </Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)}>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="w-full h-11 rounded-xl text-[14px] font-semibold text-white"
                        style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899)", boxShadow: "0 0 20px rgba(139,92,246,0.35)" }}
                      >
                        Get started
                      </motion.button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Video Demo Modal (Fullscreen continuous video & header) ─────────────
const VideoModal = ({ isOpen, onClose }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuthStore();

  useClickOutside(dropdownRef, () => setDropdownOpen(false), { enabled: dropdownOpen });

  const dashboardPath = user?.role === "admin"
    ? "/admin"
    : user?.role === "client"
    ? "/client/dashboard"
    : "/dashboard";

  const profilePath = user?.role === "admin"
    ? "/admin/profile"
    : user?.role === "client"
    ? "/client/profile"
    : "/profile";

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [
    { label: "Product",      href: "#product" },
    { label: "Features",     href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Why Skillora", href: "#why-skillora" },
    { label: "Reviews",      href: "#reviews" },
  ];

  const handleNavClick = (e, href) => {
    onClose();
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden flex flex-col justify-between"
      >
        {/* Continuous Fullscreen Video (No progressbar / controls) */}
        <div className="absolute inset-0 z-0 w-full h-full bg-black cursor-pointer" onClick={onClose}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/landing-bg.mp4" type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
        </div>

        {/* Top Header Overlay */}
        <div
          className="relative z-20 w-full h-[76px] px-6 sm:px-10 lg:px-14 flex items-center justify-between border-none bg-transparent"
        >
          {/* Logo — Left */}
          <div className="flex items-center">
            <Link to="/" onClick={onClose} style={{ textDecoration: "none" }}>
              <span
                className="hover:opacity-90 transition-opacity cursor-pointer block"
                style={{
                  fontFamily: "'Sora','Inter',sans-serif",
                  fontSize: 27,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "#fff",
                  textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)",
                }}
              >
                Skillora
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links — Center */}
          <div className="hidden md:flex items-center justify-center gap-7 lg:gap-9">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => handleNavClick(e, l.href)}
                className="text-[14px] font-semibold text-white hover:text-purple-300 transition-all duration-200"
                style={{
                  textShadow: "0 0 10px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,1)",
                  filter: "drop-shadow(0 0 8px rgba(0,0,0,0.95)) drop-shadow(0 2px 4px rgba(0,0,0,1))",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-6">
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-150 group cursor-pointer"
                    style={{
                      background: "rgba(8, 12, 24, 0.75)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{
                        background: user?.avatar ? "transparent" : "linear-gradient(135deg,#635BFF,#8579FF)",
                        boxShadow: "0 0 12px rgba(99,91,255,0.5)"
                      }}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getInitials(user?.name)
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080B16]"
                        style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                    </div>
                    <div className="flex flex-col justify-center text-left py-0.5">
                      <p className="text-xs font-bold text-white group-hover:text-purple-200 transition-colors leading-tight truncate max-w-[120px]"
                        style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                        {user?.name}
                      </p>
                      <p className="text-[11px] font-semibold capitalize leading-tight mt-0.5"
                        style={{ color: "#C4B5FD", textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                        {user?.role || "user"}
                      </p>
                    </div>
                    <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-0.5">
                      <ChevronDown size={14} className="text-gray-300 group-hover:text-white transition-colors" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl overflow-hidden"
                        style={{
                          background: "linear-gradient(160deg,rgba(12,19,36,0.98) 0%,rgba(8,14,26,0.98) 100%)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          boxShadow: "0 0 0 1px rgba(99,91,255,0.1), 0 20px 48px rgba(0,0,0,0.65)",
                          backdropFilter: "blur(24px)",
                        }}
                      >
                        <div className="absolute top-0 inset-x-0 h-px"
                          style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.3),transparent)" }} />
                        <div className="py-2 px-2 space-y-1">
                          <Link to={dashboardPath} onClick={() => { setDropdownOpen(false); onClose(); }}>
                            <motion.div
                              whileHover={{ x: 2 }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
                              style={{ color: "#9CA3AF" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#F9FAFB"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                            >
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
                                <LayoutDashboard size={13} className="text-purple-400" />
                              </div>
                              <span className="font-medium">Dashboard</span>
                            </motion.div>
                          </Link>
                          <Link to={profilePath} onClick={() => { setDropdownOpen(false); onClose(); }}>
                            <motion.div
                              whileHover={{ x: 2 }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
                              style={{ color: "#9CA3AF" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#F9FAFB"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                            >
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                <User size={13} />
                              </div>
                              <span className="font-medium">Profile</span>
                            </motion.div>
                          </Link>
                        </div>
                        <div className="px-2 pb-2 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <motion.button
                            whileHover={{ x: 2 }}
                            onClick={() => { setDropdownOpen(false); onClose(); logout(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 transition-all duration-150 cursor-pointer"
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                              <LogOut size={13} className="text-red-400" />
                            </div>
                            <span className="font-medium">Sign out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/login" onClick={onClose}>
                    <span
                      className="text-[14px] font-semibold text-white hover:text-purple-300 transition-colors cursor-pointer"
                      style={{
                        textShadow: "0 2px 10px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)",
                      }}
                    >
                      Sign in
                    </span>
                  </Link>

                  <Link to="/register" onClick={onClose}>
                    <button
                      className="relative h-10 px-6 rounded-full text-[14px] font-semibold text-white flex items-center gap-2 overflow-hidden transition-transform active:scale-95 cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 45%, #EC4899 100%)",
                        boxShadow: "0 4px 18px rgba(124,58,237,0.4)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      Get started
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom subtle bar */}
        <div className="relative z-10 w-full p-6 flex justify-between items-center pointer-events-none bg-gradient-to-t from-black/70 to-transparent">
          <span className="text-xs text-slate-300 font-medium tracking-wide">
            Skillora Platform Overview
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Press Esc to exit
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Hero ─────────────────────────────────────────────────
const Hero = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { scrollY } = useScroll();
  const textY   = useTransform(scrollY, [0, 400], [0, 60]);
  const opacity = useTransform(scrollY, [0, 320], [1, 0]);

  return (
    <>
      <VideoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />

      <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 pt-28 md:pt-36 pb-16 overflow-hidden">

      {/* ── Layer 1: Background video (Contained exclusively inside Hero section) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{
            objectPosition: "75% center",
            filter: "brightness(0.65) contrast(1.15) saturate(1.1)",
          }}
        >
          <source src="/videos/landing-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ── Layer 2: Dark gradient overlay (darker on left for text readability, clear on right for video) ── */}
      <div className="absolute inset-0 z-[2]" style={{
        background: "linear-gradient(to right, rgba(7,10,20,0.88) 0%, rgba(7,10,20,0.68) 40%, rgba(7,10,20,0.12) 75%, rgba(7,10,20,0.3) 100%)",
      }} />

      {/* ── Layer 3: Ambient glow behind headline ── */}
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{
        background: "radial-gradient(ellipse 55% 55% at 25% 45%, rgba(99,91,255,0.25) 0%, transparent 70%)",
      }} />
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{
        background: "radial-gradient(ellipse 35% 35% at 25% 45%, rgba(0,212,255,0.1) 0%, transparent 60%)",
      }} />

      {/* ── Content (Positioned on the Left half to reveal right side background video) ── */}
      <motion.div style={{ y: textY, opacity }} className="relative z-10 max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col items-start text-left mt-4 md:mt-8">

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-extrabold leading-[1.12] mb-6 tracking-tight flex flex-col items-start text-left"
          style={{ letterSpacing: "-0.03em" }}
        >
          <span className="block text-[clamp(2.2rem,4.8vw,4.5rem)] text-left" style={{
            color: "#ffffff",
            textShadow: "0 2px 16px rgba(0,0,0,0.9)",
          }}>
            The AI Workspace for Freelancers
          </span>
          <span className="block mt-2 text-[clamp(1.6rem,3.4vw,2.9rem)] font-bold tracking-normal text-left" style={{
            background: "linear-gradient(135deg, #60A5FA 0%, #C084FC 45%, #F472B6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Manage Clients. Deliver Projects. Get Paid.
          </span>
        </motion.h1>

        {/* Subtext — Left aligned */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(1rem,1.7vw,1.2rem)] max-w-xl mb-10 font-medium leading-[1.7] text-left text-slate-200"
          style={{
            textShadow: "0 2px 12px rgba(0,0,0,0.95)",
          }}
        >
          An all-in-one platform for invoicing, skill tracking, proposals, and smart analytics built to help independent professionals scale faster.
        </motion.p>

        {/* CTAs — Left aligned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link to={isAuthenticated && user ? (user?.role === "admin" ? "/admin" : user?.role === "client" ? "/client/dashboard" : "/dashboard") : "/register"}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative h-[50px] px-8 rounded-2xl text-[14px] font-semibold text-white flex items-center gap-2.5 overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.2) inset",
                letterSpacing: "0.01em",
              }}
            >
              {/* Inner top highlight border */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
              <span>{isAuthenticated && user ? "Go to Dashboard" : "Start Building"}</span>
              <ArrowRight size={15} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </Link>

          <motion.button
            onClick={() => setDemoOpen(true)}
            whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.28)" }}
            whileTap={{ scale: 0.97 }}
            className="group h-[50px] px-7 rounded-2xl text-[14px] font-semibold text-white flex items-center gap-2.5 transition-all duration-300 cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              textShadow: "0 1px 8px rgba(0,0,0,0.8)",
            }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 border border-white/20 transition-transform duration-300 group-hover:scale-105">
              <Play size={10} fill="currentColor" className="ml-0.5 text-white" />
            </div>
            <span>View Demo</span>
          </motion.button>
        </motion.div>

        {/* ── Scroll indicator (Left Aligned) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-12 md:mt-14 flex items-center gap-3"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5 bg-black/40 backdrop-blur-md"
            style={{ border: "1.5px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 16px rgba(0,0,0,0.6)" }}
          >
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 rounded-full bg-purple-400"
            />
          </motion.div>
          <span
            className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-200"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.95)" }}
          >
            Scroll to explore
          </span>
        </motion.div>

      </motion.div>

    </section>
    </>
  );
};

// ─── Metrics / Trust ──────────────────────────────────────
// ─── Product Preview (tabs) ───────────────────────────────
const tabs = [
  {
    id: "projects", label: "Projects", icon: Kanban,
    title: "Kanban-powered project management",
    desc: "Visualize every project with drag-and-drop boards. Track progress, set deadlines, tag team members, and never miss a milestone.",
    preview: [
      {
        col: "In Progress", color: "#3B82F6",
        items: [
          { title: "SaaS Dashboard Redesign", client: "Acme Corp", tag: "Design", tagBg: "rgba(59,130,246,0.15)", tagColor: "#60A5FA", progress: 75, due: "Tomorrow" },
          { title: "Stripe Webhook Sync", client: "TechStart", tag: "Backend", tagBg: "rgba(139,92,246,0.15)", tagColor: "#C084FC", progress: 40, due: "3 days" },
        ],
      },
      {
        col: "Review", color: "#F59E0B",
        items: [
          { title: "Client Onboarding Flow", client: "DesignCo", tag: "UX", tagBg: "rgba(245,158,11,0.15)", tagColor: "#FBBF24", progress: 90, due: "Today" },
        ],
      },
      {
        col: "Completed", color: "#10B981",
        items: [
          { title: "Brand Identity Guidelines", client: "BuildFast", tag: "Branding", tagBg: "rgba(16,185,129,0.15)", tagColor: "#34D399", progress: 100, due: "Done" },
        ],
      },
    ],
  },
  {
    id: "payments", label: "Payments", icon: CreditCard,
    title: "Invoicing that gets you paid faster",
    desc: "Create professional line-item invoices in seconds. Track real-time status, send automatic reminders, and accept Razorpay payments.",
    preview: null,
  },
  {
    id: "clients", label: "Clients", icon: Users,
    title: "Your client relationships, organized",
    desc: "Keep every client contact, contract value, project history, and portal link in one sleek, centralized database.",
    preview: null,
  },
  {
    id: "ai", label: "AI Assistant", icon: Brain,
    title: "Your AI-powered business partner",
    desc: "Get intelligent suggestions, auto-draft proposal emails, compute project profit margins, and forecast monthly revenue.",
    preview: null,
  },
];

const ProductPreview = () => {
  const [active, setActive] = useState("projects");
  const tab = tabs.find((t) => t.id === active);

  return (
    <section id="product" className="min-h-[85vh] md:min-h-[90vh] py-36 md:py-44 px-6 flex flex-col justify-center scroll-mt-20" style={{ background: "rgba(7,10,20,0.75)", backdropFilter: "blur(2px)" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>Product</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Everything you need.<br />Nothing you don't.
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">Explore how Skillora brings your tasks, invoices, client portal, and AI insights into one unified interface.</p>
        </FadeIn>

        {/* Tab bar */}
        <div className="flex items-center justify-center gap-3 mb-12 flex-wrap">
          {tabs.map((t) => (
            <motion.button
              key={t.id}
              onClick={() => setActive(t.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all duration-250"
              style={{
                background: active === t.id
                  ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.15))"
                  : "rgba(255,255,255,0.03)",
                border: active === t.id
                  ? "1px solid rgba(139,92,246,0.5)"
                  : "1px solid rgba(255,255,255,0.07)",
                color: active === t.id ? "#E9D5FF" : "rgba(203,213,225,0.75)",
                boxShadow: active === t.id ? "0 0 24px rgba(139,92,246,0.25)" : "none",
              }}
            >
              <t.icon size={16} style={{ color: active === t.id ? "#C084FC" : "#94A3B8" }} /> {t.label}
            </motion.button>
          ))}
        </div>

        {/* Preview panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, rgba(17,24,39,0.95), rgba(11,15,26,0.98))",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="grid lg:grid-cols-12 gap-0 min-h-[420px]">
              {/* Left: text */}
              <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-800/60">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <tab.icon size={22} style={{ color: "#C084FC" }} />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">{tab.title}</h3>
                <p className="text-slate-300 leading-relaxed mb-8 text-[14px] md:text-[15px]">{tab.desc}</p>
                <Link to="/register">
                  <motion.button
                    whileHover={{ x: 6 }}
                    className="flex items-center gap-2 text-[14px] font-semibold"
                    style={{ color: "#C084FC" }}
                  >
                    Explore {tab.label} Feature <ChevronRight size={16} />
                  </motion.button>
                </Link>
              </div>

              {/* Right: visual */}
              <div className="lg:col-span-7 p-6 md:p-8 flex items-center justify-center"
                style={{ background: "rgba(7,10,20,0.5)" }}>
                {active === "projects" && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tab.preview.map((col) => (
                      <div key={col.col} className="rounded-2xl p-3.5"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                            <span className="text-[12px] font-bold text-slate-300">{col.col}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">{col.items.length}</span>
                        </div>
                        {col.items.map((item) => (
                          <div key={item.title} className="mb-3 p-3.5 rounded-xl transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                                style={{ background: item.tagBg, color: item.tagColor }}>
                                {item.tag}
                              </span>
                              <span className="text-[10px] text-slate-400">{item.due}</span>
                            </div>
                            <p className="text-[12px] font-semibold text-white mb-1">{item.title}</p>
                            <p className="text-[11px] text-slate-400 mb-2.5">{item.client}</p>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                              <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: col.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {active === "payments" && (
                  <div className="w-full max-w-lg space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl mb-2"
                      style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05))", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Total Revenue (This Month)</p>
                        <p className="text-2xl font-bold text-white mt-0.5">₹1,35,500</p>
                      </div>
                      <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        +24.5% vs last mo
                      </span>
                    </div>
                    {[
                      { invNo: "INV-2025-004", client: "Acme Corp", amount: "₹45,000", status: "Paid", color: "#10B981", date: "Aug 02, 2026" },
                      { invNo: "INV-2025-003", client: "TechStart Inc", amount: "₹28,500", status: "Pending", color: "#F59E0B", date: "Due in 4 days" },
                      { invNo: "INV-2025-002", client: "DesignCo Agency", amount: "₹62,000", status: "Paid", color: "#10B981", date: "Jul 28, 2026" },
                    ].map((inv) => (
                      <div key={inv.invNo} className="flex items-center justify-between px-5 py-3.5 rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${inv.color}15`, border: `1px solid ${inv.color}25` }}>
                            <CreditCard size={16} style={{ color: inv.color }} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-white">{inv.client}</p>
                            <p className="text-[11px] text-slate-400">{inv.invNo} • {inv.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold text-white">{inv.amount}</p>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ background: `${inv.color}18`, color: inv.color, border: `1px solid ${inv.color}30` }}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {active === "clients" && (
                  <div className="w-full max-w-lg space-y-3">
                    {[
                      { name: "Acme Corp", contact: "sarah@acme.com", projects: 3, revenue: "₹1,45,000", status: "Active", color: "#3B82F6" },
                      { name: "TechStart Inc", contact: "alex@techstart.io", projects: 2, revenue: "₹85,000", status: "Active", color: "#10B981" },
                      { name: "DesignCo Agency", contact: "mira@designco.net", projects: 4, revenue: "₹2,10,000", status: "VIP Client", color: "#8B5CF6" },
                    ].map((c) => (
                      <div key={c.name} className="flex items-center justify-between px-5 py-4 rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shadow-inner"
                            style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }}>
                            {c.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-white">{c.name}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: `${c.color}18`, color: c.color }}>{c.status}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{c.contact} • {c.projects} active projects</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-white">{c.revenue}</p>
                          <p className="text-[10px] text-slate-500">Lifetime value</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {active === "ai" && (
                  <div className="w-full max-w-lg space-y-3">
                    <div className="p-3.5 rounded-2xl mb-2 flex items-center gap-3"
                      style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
                      <Bot size={20} className="text-purple-400 shrink-0" />
                      <p className="text-[12px] text-purple-200">
                        <span className="font-semibold text-white">Skillora AI</span> has contextual awareness of your clients & revenue.
                      </p>
                    </div>
                    {[
                      { role: "user", msg: "Draft a proposal for Acme Corp's mobile app overhaul." },
                      { role: "ai", msg: "Here is your customized proposal draft detailing deliverables, ₹95,000 milestone breakdown, and estimated 3-week completion." },
                      { role: "user", msg: "What is my average hourly rate across active projects?" },
                      { role: "ai", msg: "Your average rate is ₹2,850/hr across 4 projects. Recommendation: bump Acme Corp's new quote by 15%." },
                    ].map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[85%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed"
                          style={{
                            background: m.role === "user"
                              ? "linear-gradient(135deg, rgba(99,91,255,0.25), rgba(139,92,246,0.2))"
                              : "rgba(255,255,255,0.04)",
                            border: `1px solid ${m.role === "user" ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.07)"}`,
                            color: m.role === "user" ? "#E9D5FF" : "#CBD5E1",
                          }}>
                          {m.msg}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

// ─── Value cards ──────────────────────────────────────────
const values = [
  {
    icon: Zap, title: "Lightning-fast workflow",
    desc: "From signup to your first invoice in under 2 minutes. No bloat, no friction — just the tools you need.",
    color: "#F59E0B", gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.02))",
  },
  {
    icon: Shield, title: "Enterprise-grade security",
    desc: "JWT + refresh tokens, encrypted at rest, webhook HMAC verification, and role-based access control.",
    color: "#10B981", gradient: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.02))",
  },
  {
    icon: Brain, title: "AI that knows your business",
    desc: "Context-aware assistant that analyzes your clients, revenue, and projects to give actionable advice.",
    color: "#8B5CF6", gradient: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.02))",
  },
  {
    icon: Globe, title: "Pixel-perfect everywhere",
    desc: "Responsive from mobile to ultrawide. Dedicated client portal so your clients get a premium experience.",
    color: "#3B82F6", gradient: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.02))",
  },
];

const ValueSection = () => (
  <section id="why-skillora" className="min-h-[85vh] md:min-h-[90vh] py-36 md:py-44 px-6 flex flex-col justify-center scroll-mt-20" style={{ background: "rgba(7,10,20,0.78)", backdropFilter: "blur(2px)" }}>
    <div className="max-w-6xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>Why Skillora</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Built different. Built for freelancers.
        </h2>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">Not another generic project tool — Skillora is purpose-built for the way independent professionals actually run their business.</p>
      </FadeIn>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {values.map((v, i) => (
          <FadeIn key={v.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -8, boxShadow: `0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px ${v.color}40` }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl p-7 h-full relative overflow-hidden group"
              style={{
                background: v.gradient,
                border: `1px solid ${v.color}20`,
              }}
            >
              {/* Hover glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `${v.color}15` }} />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${v.color}20`, border: `1px solid ${v.color}35` }}>
                  <v.icon size={20} style={{ color: v.color }} />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-3">{v.title}</h3>
                <p className="text-[13px] text-slate-300 leading-relaxed">{v.desc}</p>
              </div>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

// ─── Feature grid (Bento style) ───────────────────────────
const primaryFeatures = [
  {
    icon: Kanban, title: "Kanban Project Boards",
    desc: "Drag-and-drop tasks across customizable columns. Set deadlines, assign priorities, and track every milestone from start to delivery.",
    color: "#3B82F6", span: "md:col-span-2",
  },
  {
    icon: FileText, title: "Professional Invoicing",
    desc: "Generate line-item invoices with tax, discounts, and notes. Mark sent, track payments, and auto-number with sequential IDs.",
    color: "#10B981", span: "",
  },
  {
    icon: Bot, title: "AI Business Assistant",
    desc: "Get context-aware proposals, pricing advice, revenue analysis, and smart task suggestions — powered by your real workspace data.",
    color: "#8B5CF6", span: "",
  },
  {
    icon: CreditCard, title: "Razorpay Payments",
    desc: "Accept online payments directly on invoices. Clients pay in one click through the secure client portal.",
    color: "#F59E0B", span: "md:col-span-2",
  },
];

const secondaryFeatures = [
  { icon: Users, title: "Client Portal", desc: "Branded portal where clients view projects, download invoices, and make payments", color: "#EC4899" },
  { icon: BarChart3, title: "Revenue Analytics", desc: "Real-time dashboards tracking earnings, growth trends, and client metrics", color: "#06B6D4" },
  { icon: LayoutDashboard, title: "Unified Dashboard", desc: "Everything at a glance — projects, tasks, invoices, and AI insights in one view", color: "#8B5CF6" },
  { icon: Clock, title: "Activity Timeline", desc: "Full audit trail of every action across your workspace for accountability", color: "#F59E0B" },
  { icon: Star, title: "Client Ratings", desc: "Rate clients, track satisfaction, and prioritize your best relationships", color: "#10B981" },
  { icon: Shield, title: "Role-based Access", desc: "Freelancer, Admin, and Client roles with granular permission control", color: "#3B82F6" },
];

const FeatureGrid = () => (
  <section id="features" className="min-h-[85vh] md:min-h-[90vh] py-36 md:py-44 px-6 flex flex-col justify-center scroll-mt-20" style={{ background: "rgba(7,10,20,0.72)", backdropFilter: "blur(2px)" }}>
    <div className="max-w-6xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>Features</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          One platform. Every tool you need.
        </h2>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">From winning clients to getting paid — manage your entire freelance business without switching tabs.</p>
      </FadeIn>

      {/* Primary features — bento grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {primaryFeatures.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.08} className={f.span}>
            <motion.div
              whileHover={{ y: -4, borderColor: `${f.color}50` }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl p-7 h-full relative overflow-hidden group"
              style={{
                background: `linear-gradient(160deg, ${f.color}0A, rgba(255,255,255,0.02))`,
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `${f.color}12` }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          </FadeIn>
        ))}
      </div>

      {/* Secondary features — compact grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {secondaryFeatures.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.06}>
            <motion.div
              whileHover={{ scale: 1.02, borderColor: `${f.color}40` }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-5 group"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 transition-all duration-300"
                style={{ background: `${f.color}12`, border: `1px solid ${f.color}20` }}>
                <f.icon size={16} style={{ color: f.color }} />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-[12px] text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

// ─── How it works (horizontal timeline) ───────────────────
const steps = [
  {
    n: "01", title: "Sign up in seconds",
    desc: "Create your free account with email or Google OAuth. No credit card, no setup wizard — you're in immediately.",
    icon: Zap, color: "#3B82F6",
  },
  {
    n: "02", title: "Set up your workspace",
    desc: "Add clients, create projects with Kanban boards, and configure your invoice branding. Import existing data or start fresh.",
    icon: LayoutDashboard, color: "#8B5CF6",
  },
  {
    n: "03", title: "Invoice & get paid",
    desc: "Generate professional invoices, send them via the client portal, and accept Razorpay payments — all without leaving Skillora.",
    icon: CreditCard, color: "#10B981",
  },
  {
    n: "04", title: "Grow with AI insights",
    desc: "Your AI assistant analyzes your workspace — suggesting pricing, drafting proposals, and spotting revenue trends to help you scale.",
    icon: Brain, color: "#EC4899",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="min-h-[85vh] md:min-h-[90vh] py-36 md:py-44 px-6 flex flex-col justify-center scroll-mt-20" style={{ background: "rgba(7,10,20,0.78)", backdropFilter: "blur(2px)" }}>
    <div className="max-w-5xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>How It Works</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          From zero to paid in four steps
        </h2>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">No learning curve. No onboarding calls. Just results.</p>
      </FadeIn>

      {/* Timeline */}
      <div className="relative">
        {/* Horizontal connecting line (desktop) */}
        <div className="absolute top-[44px] left-[10%] right-[10%] h-px hidden md:block"
          style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5), rgba(16,185,129,0.5), rgba(236,72,153,0.5))" }} />

        {/* Vertical connecting line (mobile) */}
        <div className="absolute left-[30px] top-20 bottom-20 w-px md:hidden"
          style={{ background: "linear-gradient(to bottom, rgba(59,130,246,0.5), rgba(236,72,153,0.5))" }} />

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="relative flex md:flex-col items-start gap-5 md:text-center md:items-center"
              >
                {/* Step circle */}
                <motion.div
                  whileHover={{ scale: 1.1, boxShadow: `0 0 30px ${s.color}30` }}
                  className="w-[60px] h-[60px] md:w-[88px] md:h-[88px] rounded-2xl flex items-center justify-center shrink-0 relative z-10"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}20, ${s.color}08)`,
                    border: `1px solid ${s.color}35`,
                    boxShadow: `0 0 20px ${s.color}15`,
                  }}
                >
                  <s.icon size={24} style={{ color: s.color }} />
                </motion.div>

                <div className="md:mt-4">
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase mb-2 block" style={{ color: s.color }}>
                    Step {s.n}
                  </span>
                  <h3 className="text-[16px] font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ─── Testimonials ─────────────────────────────────────────
const initialTestimonials = [
  {
    name: "Priya Sharma", role: "UI/UX Designer",
    quote: "Skillora replaced 4 different tools for me. The AI assistant is a game-changer — it drafted a client proposal in 30 seconds that would've taken me an hour.",
    avatar: "PS", color: "#8B5CF6", rating: 5,
  },
  {
    name: "Arjun Mehta", role: "Full-Stack Developer",
    quote: "The client portal alone is worth it. My clients can view project status and pay invoices without a single email from me. Professional and effortless.",
    avatar: "AM", color: "#3B82F6", rating: 5,
  },
  {
    name: "Sneha Reddy", role: "Content Strategist",
    quote: "I went from chasing payments in spreadsheets to getting paid on time, every time. Razorpay integration works flawlessly with the invoicing system.",
    avatar: "SR", color: "#10B981", rating: 5,
  },
];

const Testimonials = () => {
  const [items, setItems] = useState(initialTestimonials);
  const [active, setActive] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", quote: "", rating: 5 });

  useEffect(() => {
    if (modalOpen) return;
    const timer = setInterval(() => setActive((p) => (p + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length, modalOpen]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim()) {
      toast.error("Please enter your name and review text");
      return;
    }
    const initials = form.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
    const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#EC4899", "#F59E0B"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newRev = {
      name: form.name.trim(),
      role: form.role.trim() || "Freelancer",
      quote: form.quote.trim(),
      avatar: initials,
      color: randomColor,
      rating: form.rating,
    };
    setItems((prev) => [...prev, newRev]);
    setActive(items.length);
    setForm({ name: "", role: "", quote: "", rating: 5 });
    setModalOpen(false);
    toast.success("Thank you! Your review has been added.");
  };

  return (
    <section id="reviews" className="min-h-[85vh] md:min-h-[90vh] py-36 md:py-44 px-6 flex flex-col justify-center scroll-mt-20" style={{ background: "rgba(7,10,20,0.75)", backdropFilter: "blur(2px)" }}>
      <div className="max-w-4xl mx-auto w-full">
        <FadeIn className="text-center mb-16">
          <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>Reviews</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Loved by freelancers
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">See how independent professionals scale their workflow and get paid faster with Skillora.</p>
        </FadeIn>

        <div className="relative min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl p-8 md:p-10 text-center"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex items-center gap-1 justify-center mb-6">
                {[...Array(items[active]?.rating || 5)].map((_, i) => (
                  <Star key={i} size={16} fill="#F59E0B" stroke="none" />
                ))}
              </div>
              <p className="text-[16px] md:text-[18px] text-slate-200 leading-relaxed mb-8 max-w-2xl mx-auto italic">
                "{items[active]?.quote}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                  style={{ background: items[active]?.color || "#8B5CF6" }}>
                  {items[active]?.avatar}
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-white">{items[active]?.name}</p>
                  <p className="text-[12px] text-slate-400">{items[active]?.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: i === active ? "#8B5CF6" : "rgba(255,255,255,0.15)",
                width: i === active ? 24 : 8,
              }}
            />
          ))}
        </div>

        {/* Write a Review Button */}
        <div className="flex justify-center mt-10">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(139,92,246,0.6)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModalOpen(true)}
            className="relative h-10 px-6 rounded-full text-[14px] font-semibold text-white flex items-center gap-2 overflow-hidden cursor-pointer"
            style={{
              background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 45%, #EC4899 100%)",
              boxShadow: "0 4px 18px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              letterSpacing: "0.01em",
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <MessageSquarePlus size={15} />
            <span>Write a Review</span>
          </motion.button>
        </div>

        {/* Review Submission Modal */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => setModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-lg rounded-3xl p-6 sm:p-8 overflow-hidden text-left"
                style={{
                  background: "linear-gradient(160deg, rgba(17,24,39,0.98), rgba(11,15,26,0.99))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-500/30">
                      <Star size={18} className="text-amber-400 fill-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Write a Review</h3>
                      <p className="text-xs text-slate-400">Share your experience with Skillora</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setForm({ ...form, rating: star })}
                          className="p-1 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            size={22}
                            fill={star <= form.rating ? "#F59E0B" : "none"}
                            className={star <= form.rating ? "text-amber-400" : "text-slate-600"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Role / Profession</label>
                      <input
                        type="text"
                        placeholder="e.g. Full-Stack Developer"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Review *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="What do you love about using Skillora?"
                      value={form.quote}
                      onChange={(e) => setForm({ ...form, quote: e.target.value })}
                      className="w-full p-3.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
                        boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
                      }}
                    >
                      <Send size={13} />
                      <span>Submit Review</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};


// ─── Final CTA ────────────────────────────────────────────
const FinalCTA = () => (
  <section className="min-h-[70vh] py-36 md:py-44 px-6 flex flex-col justify-center relative overflow-hidden" style={{ background: "rgba(7,10,20,0.82)", backdropFilter: "blur(2px)" }}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[300px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(99,91,255,0.18) 0%, transparent 70%)" }} />
    </div>
    <FadeIn className="relative z-10 max-w-3xl mx-auto text-center">
      <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight" style={{ letterSpacing: "-0.03em" }}>
        Your freelance business,<br />
        <span style={{
          background: "linear-gradient(135deg, #60A5FA 0%, #C084FC 50%, #F472B6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          elevated.
        </span>
      </h2>
      <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-medium">
        Ready to simplify your client workflow, invoicing, and growth? Get started in under 2 minutes.
      </p>
      <Link to="/register">
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 36px rgba(139,92,246,0.6)" }}
          whileTap={{ scale: 0.96 }}
          className="relative h-12 px-8 rounded-full text-[15px] font-semibold text-white inline-flex items-center gap-2.5 overflow-hidden cursor-pointer shadow-xl mx-auto"
          style={{
            background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 45%, #EC4899 100%)",
            boxShadow: "0 4px 24px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
            letterSpacing: "0.01em",
          }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.2) 50%,transparent 70%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <span>Get Started Free</span>
          <ArrowRight size={16} strokeWidth={2.5} />
        </motion.button>
      </Link>
      <p className="text-[12px] text-slate-400 mt-4 font-medium">
        No credit card required • Free forever plan available
      </p>
    </FadeIn>
  </section>
);

// ─── Footer ───────────────────────────────────────────────
const FooterLink = ({ href = "#", children }) => (
  <a
    href={href}
    className="group relative text-[13px] transition-colors duration-200 hover:text-white w-fit flex items-center gap-1.5"
    style={{ color: "rgba(203,213,225,0.8)" }}
  >
    {children}
    <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
      style={{ background: "linear-gradient(90deg,#3B82F6,#8B5CF6,#EC4899)" }} />
  </a>
);

const socialIcons = [
  { label: "Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "GitHub",  path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
  { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
];

const Footer = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <footer ref={ref} style={{ background: "rgba(7,10,20,0.88)", backdropFilter: "blur(2px)" }}>
      {/* Top gradient border */}
      <div className="h-px w-full" style={{
        background: "linear-gradient(90deg,transparent 0%,rgba(99,91,255,0.5) 30%,rgba(0,212,255,0.3) 60%,transparent 100%)",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="px-5 md:px-10"
      >
        {/* ── Newsletter strip ── */}
        <div className="py-12 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-[15px] font-semibold text-white mb-1">Stay in the loop</p>
            <p className="text-[13px]" style={{ color: "rgba(203,213,225,0.8)" }}>
              Product updates, tips, and freelance insights — no spam.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="you@example.com"
              className="h-10 px-4 rounded-xl text-[13px] outline-none flex-1 md:w-64"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F1F5F9",
              }}
            />
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,91,255,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 0 16px rgba(99,91,255,0.3)" }}
            >
              Subscribe
            </motion.button>
          </div>
        </div>

        {/* ── Main columns ── */}
        <div className="py-14 grid grid-cols-2 md:grid-cols-5 gap-10">

          {/* Brand — spans 2 cols */}
          <div className="col-span-2 flex flex-col gap-5">
            <Link to="/" style={{ textDecoration: "none" }}>
              <span style={{
                fontFamily: "'Sora','Inter',sans-serif",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#fff",
                filter: "drop-shadow(0 0 10px rgba(99,91,255,0.3))",
              }}>
                Skillora
              </span>
            </Link>
            <p className="text-[13px] leading-[1.7] max-w-[220px]" style={{ color: "rgba(203,213,225,0.75)" }}>
              The all-in-one operating system for modern freelancers. Manage clients, projects, invoices, and growth.
            </p>
            <div className="flex items-center gap-2.5 mt-1">
              {socialIcons.map((s) => (
                <motion.a
                  key={s.label}
                  href="#"
                  whileHover={{ scale: 1.15, filter: "drop-shadow(0 0 8px rgba(99,91,255,0.6))" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  aria-label={s.label}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" style={{ color: "rgba(203,213,225,0.7)" }}>
                    <path d={s.path} />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: "#8B5CF6" }}>Product</p>
            {["Product", "Features", "How It Works", "Why Skillora", "Reviews"].map((l) => (
              <FooterLink key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}>{l}</FooterLink>
            ))}
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: "#8B5CF6" }}>Company</p>
            {["About", "Blog", "Careers", "Press"].map((l) => (
              <FooterLink key={l}>{l}</FooterLink>
            ))}
          </div>

          {/* Legal + contact */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: "#8B5CF6" }}>Legal</p>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
              <FooterLink key={l}>{l}</FooterLink>
            ))}
            <div className="mt-3 pt-4 flex flex-col gap-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px]" style={{ color: "rgba(203,213,225,0.6)" }}>Get in touch</p>
              <FooterLink href="mailto:aaryanpatel9784@gmail.com">aaryanpatel9784@gmail.com</FooterLink>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[12px]" style={{ color: "rgba(148,163,184,0.65)" }}>
            © 2025 Skillora, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a key={l} href="#"
                className="text-[12px] transition-colors duration-200 hover:text-slate-200"
                style={{ color: "rgba(148,163,184,0.65)" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

// ─── ROOT EXPORT ──────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen relative" style={{ background: "#0B0F1A", color: "#fff" }}>
      {/* Page sections */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <ProductPreview />
        <FeatureGrid />
        <HowItWorks />
        <ValueSection />
        <Testimonials />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}
