import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Zap, LayoutDashboard, Users, CreditCard, Brain, CheckCircle2,
  ArrowRight, Star, TrendingUp, Shield, Clock, Globe,
  ChevronRight, Play, BarChart3, FileText, Kanban, Bot,
} from "lucide-react";

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
    className="group relative text-[14px] font-medium transition-colors duration-300"
    style={{
      color: "#fff",
      textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)",
    }}
    onMouseEnter={e => e.currentTarget.style.color = "#C084FC"}
    onMouseLeave={e => e.currentTarget.style.color = "#fff"}
  >
    {children}
    <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300 rounded-full"
      style={{ background: "linear-gradient(90deg,#3B82F6,#8B5CF6,#EC4899)" }} />
  </a>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    { label: "Features",     href: "#features" },
    { label: "Pricing",      href: "#pricing" },
    { label: "How it works", href: "#how-it-works" },
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
        className="fixed top-0 inset-x-0 z-40 h-[72px] px-5 md:px-10 grid grid-cols-3 items-center"
        style={{
          background: scrolled ? "rgba(8,11,22,0.82)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
          transition: "all 0.35s ease",
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
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#fff",
                cursor: "pointer",
                display: "block",
                textShadow: "0 1px 10px rgba(0,0,0,0.9)",
              }}
            >
              Skillora
            </motion.span>
          </Link>
        </div>

        {/* ── Desktop nav links — center ── */}
        <div className="hidden md:flex items-center justify-center gap-8">
          {links.map((l) => (
            <NavLink key={l.label} href={l.href}>{l.label}</NavLink>
          ))}
        </div>

        {/* ── Desktop right actions — right ── */}
        <div className="hidden md:flex items-center justify-end gap-3">
          <Link to="/login">
            <motion.span
              whileHover={{ color: "#C084FC" }}
              className="text-[13px] font-medium cursor-pointer transition-colors duration-200"
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
              whileHover={{ scale: 1.04, boxShadow: "0 0 36px rgba(139,92,246,0.7)" }}
              whileTap={{ scale: 0.96 }}
              className="relative h-9 px-5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#3B82F6 0%,#8B5CF6 50%,#EC4899 100%)",
                boxShadow: "0 0 0 1px rgba(139,92,246,0.35), 0 4px 20px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                letterSpacing: "0.01em",
              }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.14) 50%,transparent 70%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-x-0 top-0 h-px rounded-t-xl pointer-events-none"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" }} />
              Get started
              <ArrowRight size={13} strokeWidth={2.5} />
            </motion.button>
          </Link>
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Hero ─────────────────────────────────────────────────
const Hero = () => {
  const { scrollY } = useScroll();
  const bgY     = useTransform(scrollY, [0, 600], [0, 120]);
  const textY   = useTransform(scrollY, [0, 400], [0, 60]);
  const opacity = useTransform(scrollY, [0, 320], [1, 0]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">

      {/* ── Layer 2: Dark gradient overlay ── */}
      <div className="absolute inset-0 z-[2]" style={{
        background: "linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(7,10,20,0.35) 100%)",
      }} />

      {/* ── Layer 3: Radial glow behind headline ── */}
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 38%, rgba(99,91,255,0.22) 0%, transparent 70%)",
      }} />
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{
        background: "radial-gradient(ellipse 40% 30% at 50% 38%, rgba(0,212,255,0.07) 0%, transparent 60%)",
      }} />

      {/* ── Layer 4: Dot grid texture ── */}
      <div className="absolute inset-0 z-[3] opacity-[0.08] pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* ── Content ── */}
      <motion.div style={{ y: textY, opacity }} className="relative z-10 max-w-5xl mx-auto w-full">

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[1.04] mb-7 tracking-tight"
          style={{ letterSpacing: "-0.04em", textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}
        >
          <span style={{ color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>Your freelance business,</span>
          <br />
          <span style={{
            background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 45%, #EC4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(139,92,246,0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.9))",
          }}>
            finally under control.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(1rem,2vw,1.2rem)] max-w-xl mx-auto mb-12 leading-[1.7]"
          style={{ color: "rgba(226,232,240,0.95)", textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
        >
          Clients, projects, invoices, and AI insights —
          one workspace built for how you actually work.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="relative h-[52px] px-8 rounded-2xl text-[14px] font-semibold text-white flex items-center gap-2.5 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 45%, #EC4899 100%)",
                boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 8px 40px rgba(99,91,255,0.55), 0 2px 8px rgba(0,0,0,0.3)",
                letterSpacing: "0.02em",
              }}
            >
              {/* animated shimmer */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg,transparent 20%,rgba(255,255,255,0.18) 50%,transparent 80%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              />
              {/* top highlight */}
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)" }} />
              Get started
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={15} strokeWidth={2.5} />
              </motion.span>
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.22)" }}
            whileTap={{ scale: 0.96 }}
            className="h-[52px] px-7 rounded-2xl text-[14px] font-medium flex items-center gap-2.5 transition-all duration-250"
            style={{
              background: "rgba(255,255,255,0.0)",
              border: "1px solid rgba(255,255,255,0.22)",
              color: "rgba(226,232,240,0.95)",
              backdropFilter: "blur(6px)",
              letterSpacing: "0.01em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Play size={9} fill="currentColor" style={{ marginLeft: 1 }} />
            </div>
            Watch demo
          </motion.button>
        </motion.div>

      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase"
          style={{ color: "rgba(203,213,225,0.7)", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
          style={{ border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-1.5 rounded-full"
            style={{ background: "rgba(99,91,255,0.9)" }}
          />
        </motion.div>
      </motion.div>

    </section>
  );
};

// ─── Metrics / Trust ──────────────────────────────────────
// ─── Product Preview (tabs) ───────────────────────────────
const tabs = [
  {
    id: "projects", label: "Projects", icon: Kanban,
    title: "Kanban-powered project management",
    desc: "Visualize every project with drag-and-drop boards. Track progress, set deadlines, and never miss a milestone.",
    preview: [
      { col: "To Do", items: ["Brand redesign", "API integration"], color: "#3B82F6" },
      { col: "In Progress", items: ["Mobile app UI", "Client onboarding"], color: "#F59E0B" },
      { col: "Done", items: ["Logo design", "Proposal sent"], color: "#10B981" },
    ],
  },
  {
    id: "payments", label: "Payments", icon: CreditCard,
    title: "Invoicing that gets you paid faster",
    desc: "Create professional invoices in seconds. Track payments, send reminders, and accept online payments.",
    preview: null,
  },
  {
    id: "clients", label: "Clients", icon: Users,
    title: "Your client relationships, organized",
    desc: "Keep every client detail, conversation, and project history in one clean view.",
    preview: null,
  },
  {
    id: "ai", label: "AI Assistant", icon: Brain,
    title: "Your AI-powered business partner",
    desc: "Get smart suggestions, auto-draft proposals, analyze your earnings, and more.",
    preview: null,
  },
];

const ProductPreview = () => {
  const [active, setActive] = useState("projects");
  const tab = tabs.find((t) => t.id === active);

  return (
    <section id="features" className="py-24 px-6" style={{ background: "rgba(7,10,20,0.75)", backdropFilter: "blur(2px)" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-[12px] font-semibold tracking-[0.2em] uppercase text-brand mb-4" style={{ color: "#8B5CF6" }}>Product</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Everything you need.<br />Nothing you don't.
          </h2>
        </FadeIn>

        {/* Tab bar */}
        <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
          {tabs.map((t) => (
            <motion.button
              key={t.id}
              onClick={() => setActive(t.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
              style={{
                background: active === t.id ? "rgba(99,91,255,0.15)" : "rgba(255,255,255,0.04)",
                border: active === t.id ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.07)",
                color: active === t.id ? "#C084FC" : "rgba(203,213,225,0.8)",
                boxShadow: active === t.id ? "0 0 20px rgba(139,92,246,0.2)" : "none",
              }}
            >
              <t.icon size={14} /> {t.label}
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
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg,rgba(17,24,39,0.8),rgba(11,15,26,0.9))",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
            }}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: text */}
              <div className="p-10 flex flex-col justify-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
                  <tab.icon size={18} style={{ color: "#A39AFF" }} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{tab.title}</h3>
                <p className="text-slate-300 leading-relaxed mb-8">{tab.desc}</p>
                <Link to="/register">
                  <motion.button
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-2 text-[13px] font-semibold text-brand-300"
                    style={{ color: "#C084FC" }}
                  >
                    Try it free <ChevronRight size={14} />
                  </motion.button>
                </Link>
              </div>
              {/* Right: visual */}
              <div className="p-6 flex items-center justify-center min-h-[280px]"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                {active === "projects" && (
                  <div className="w-full grid grid-cols-3 gap-3">
                    {tab.preview.map((col) => (
                      <div key={col.col} className="rounded-xl p-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                          <span className="text-[11px] font-semibold text-slate-400">{col.col}</span>
                        </div>
                        {col.items.map((item) => (
                          <div key={item} className="mb-2 px-3 py-2 rounded-lg text-[12px] text-slate-300"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            {item}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {active === "payments" && (
                  <div className="w-full space-y-3">
                    {[
                      { client: "Acme Corp", amount: "₹45,000", status: "Paid", color: "#10B981" },
                      { client: "TechStart", amount: "₹28,500", status: "Pending", color: "#F59E0B" },
                      { client: "DesignCo", amount: "₹62,000", status: "Overdue", color: "#EF4444" },
                    ].map((inv) => (
                      <div key={inv.client} className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div>
                          <p className="text-[13px] font-medium text-white">{inv.client}</p>
                          <p className="text-[11px] text-slate-500">Invoice</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-white">{inv.amount}</p>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: `${inv.color}18`, color: inv.color }}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {active === "clients" && (
                  <div className="w-full space-y-3">
                    {["Acme Corp", "TechStart Inc", "DesignCo", "BuildFast"].map((c, i) => (
                      <div key={c} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                          style={{ background: ["#3B82F6","#10B981","#8B5CF6","#F59E0B"][i] }}>
                          {c[0]}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-white">{c}</p>
                          <p className="text-[11px] text-slate-500">{[3,5,2,4][i]} active projects</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {active === "ai" && (
                  <div className="w-full space-y-3">
                    {[
                      { role: "user", msg: "Draft a proposal for a logo project" },
                      { role: "ai", msg: "Sure! Here's a professional proposal for your logo design project..." },
                      { role: "user", msg: "What's my revenue this month?" },
                      { role: "ai", msg: "Your revenue this month is ₹1,24,500 — up 22% from last month 🚀" },
                    ].map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[80%] px-3 py-2 rounded-xl text-[12px]"
                          style={{
                            background: m.role === "user" ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${m.role === "user" ? "rgba(99,91,255,0.3)" : "rgba(255,255,255,0.07)"}`,
                            color: m.role === "user" ? "#C4BFFF" : "#CBD5E1",
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
  { icon: Zap, title: "Built for speed", desc: "From signup to first invoice in under 2 minutes.", color: "#F59E0B" },
  { icon: Shield, title: "Bank-grade security", desc: "JWT auth, encrypted data, and SOC2-ready infrastructure.", color: "#10B981" },
  { icon: Brain, title: "AI-powered insights", desc: "Smart suggestions that help you earn more and work less.", color: "#8B5CF6" },
  { icon: Globe, title: "Works everywhere", desc: "Desktop, tablet, mobile — pixel-perfect on every screen.", color: "#3B82F6" },
];

const ValueSection = () => (
  <section className="py-24 px-6" style={{ background: "rgba(7,10,20,0.78)", backdropFilter: "blur(2px)" }}>
    <div className="max-w-6xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>Why Skillora</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Designed for how you actually work
        </h2>
      </FadeIn>
      <div className="grid md:grid-cols-4 gap-5">
        {values.map((v, i) => (
          <FadeIn key={v.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6, boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px ${v.color}30` }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 h-full"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${v.color}18`, border: `1px solid ${v.color}30` }}>
                <v.icon size={18} style={{ color: v.color }} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">{v.title}</h3>
              <p className="text-[13px] text-slate-300 leading-relaxed">{v.desc}</p>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

// ─── Feature grid ─────────────────────────────────────────
const features = [
  { icon: Kanban,       title: "Kanban Boards",      desc: "Drag-and-drop project management" },
  { icon: FileText,     title: "Smart Invoicing",     desc: "Professional invoices in seconds" },
  { icon: Users,        title: "Client CRM",          desc: "All your client data in one place" },
  { icon: Brain,        title: "AI Assistant",        desc: "Proposals, insights, and more" },
  { icon: BarChart3,    title: "Analytics",           desc: "Revenue trends and forecasts" },
  { icon: Clock,        title: "Time Tracking",       desc: "Log hours, bill accurately" },
  { icon: TrendingUp,   title: "Growth Insights",     desc: "Know what's working" },
  { icon: Shield,       title: "Secure & Private",    desc: "Your data, always protected" },
];

const FeatureGrid = () => (
  <section className="py-24 px-6" style={{ background: "rgba(7,10,20,0.72)", backdropFilter: "blur(2px)" }}>
    <div className="max-w-6xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>Features</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          One platform. Infinite possibilities.
        </h2>
      </FadeIn>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.06}>
            <motion.div
              whileHover={{ scale: 1.03, borderColor: "rgba(99,91,255,0.4)" }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <f.icon size={16} style={{ color: "#C084FC" }} />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-[12px] text-slate-300">{f.desc}</p>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

// ─── How it works ─────────────────────────────────────────
const steps = [
  { n: "01", title: "Create your account", desc: "Sign up free in 30 seconds. No credit card needed." },
  { n: "02", title: "Add clients & projects", desc: "Import or create your clients and kick off your first project." },
  { n: "03", title: "Get paid & grow", desc: "Send invoices, track payments, and use AI insights to scale." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 px-6" style={{ background: "rgba(7,10,20,0.78)", backdropFilter: "blur(2px)" }}>
    <div className="max-w-4xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>How it works</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Up and running in minutes
        </h2>
      </FadeIn>
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-8 top-10 bottom-10 w-px hidden md:block"
          style={{ background: "linear-gradient(to bottom, rgba(99,91,255,0.5), rgba(0,212,255,0.3))" }} />
        <div className="space-y-8">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.15}>
              <motion.div
                whileHover={{ x: 6 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-6 pl-0 md:pl-4"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
                  style={{
                    background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(236,72,153,0.1))",
                    border: "1px solid rgba(139,92,246,0.35)",
                    color: "#C084FC",
                  }}>
                  {s.n}
                </div>
                <div className="pt-3">
                  <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-slate-300 text-[14px]">{s.desc}</p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ─── Pricing ──────────────────────────────────────────────
const plans = [
  {
    name: "Free", price: "₹0", period: "/mo", highlight: false,
    desc: "Perfect to get started",
    features: ["3 Projects", "5 Clients", "10 Invoices", "20 AI requests", "Kanban boards"],
  },
  {
    name: "Pro", price: "₹1,499", period: "/mo", highlight: true,
    desc: "For growing freelancers",
    features: ["25 Projects", "50 Clients", "100 Invoices", "200 AI requests", "Analytics", "Priority support"],
  },
  {
    name: "Premium", price: "₹3,999", period: "/mo", highlight: false,
    desc: "Unlimited everything",
    features: ["Unlimited Projects", "Unlimited Clients", "Unlimited Invoices", "Unlimited AI", "Custom domain", "White-label"],
  },
];

const Pricing = () => (
  <section id="pricing" className="py-24 px-6" style={{ background: "rgba(7,10,20,0.8)", backdropFilter: "blur(2px)" }}>
    <div className="max-w-5xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-[12px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "#8B5CF6" }}>Pricing</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Simple, transparent pricing
        </h2>
        <p className="text-slate-300 mt-4">Start free. Upgrade when you're ready.</p>
      </FadeIn>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p, i) => (
          <FadeIn key={p.name} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-7 flex flex-col h-full relative overflow-hidden"
              style={{
                background: p.highlight
                  ? "linear-gradient(160deg,rgba(99,91,255,0.15),rgba(0,212,255,0.05))"
                  : "rgba(255,255,255,0.03)",
                border: p.highlight ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.07)",
                boxShadow: p.highlight ? "0 0 40px rgba(99,91,255,0.15)" : "none",
              }}
            >
              {p.highlight && (
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: "rgba(139,92,246,0.2)", color: "#C084FC", border: "1px solid rgba(139,92,246,0.35)" }}>
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                <p className="text-[13px] text-slate-300 mb-4">{p.desc}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{p.price}</span>
                  <span className="text-slate-400 mb-1">{p.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px] text-slate-200">
                    <CheckCircle2 size={14} className="shrink-0" style={{ color: p.highlight ? "#A39AFF" : "#10B981" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-11 rounded-xl text-[14px] font-semibold transition-all duration-200"
                  style={p.highlight ? {
                    background: "linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899)",
                    color: "#fff",
                    boxShadow: "0 0 24px rgba(139,92,246,0.4)",
                  } : {
                    background: "rgba(255,255,255,0.06)",
                    color: "#CBD5E1",                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  Get started
                </motion.button>
              </Link>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

// ─── Final CTA ────────────────────────────────────────────
const FinalCTA = () => (
  <section className="py-32 px-6 relative overflow-hidden" style={{ background: "rgba(7,10,20,0.82)", backdropFilter: "blur(2px)" }}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[300px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(99,91,255,0.15) 0%, transparent 70%)" }} />
    </div>
    <FadeIn className="relative z-10 max-w-3xl mx-auto text-center">
      <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight" style={{ letterSpacing: "-0.03em" }}>
        Your freelance business,<br />
        <span style={{
          background: "linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          elevated.
        </span>
      </h2>
      <p className="text-slate-300 text-lg mb-10">Join 10,000+ freelancers already using Skillora.</p>
      <Link to="/register">
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(99,91,255,0.5)" }}
          whileTap={{ scale: 0.97 }}
          className="h-14 px-10 rounded-2xl text-[16px] font-semibold text-white flex items-center gap-2 mx-auto"
          style={{
            background: "linear-gradient(135deg,#5B54F0,#7C6FF7,#6366F1)",
            boxShadow: "0 0 30px rgba(99,91,255,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          Start for free — no card needed <ArrowRight size={18} />
        </motion.button>
      </Link>
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
            {["Features", "Pricing", "How it works", "Changelog"].map((l) => (
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
              <FooterLink href="mailto:hello@skillora.io">hello@skillora.io</FooterLink>
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

      {/* ── Global video background — fixed behind entire page ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(0.5px)" }}
        >
          <source src="/videos/landing-bg.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay so sections below hero remain readable */}
        <div className="absolute inset-0" style={{ background: "rgba(7,10,20,0.28)" }} />
      </div>

      {/* All page content sits above the video */}
      <div className="relative z-10">
        <CursorGlow />
        <Navbar />
        <Hero />
        <ProductPreview />
        <ValueSection />
        <FeatureGrid />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}
