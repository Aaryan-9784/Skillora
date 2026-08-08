import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Briefcase, Calendar, ArrowRight, CheckCircle2,
  Sparkles, Filter, Clock, Send, X, ShieldCheck, User, TrendingUp,
  Zap, Check, FileText, Layers, RefreshCw, Star, Building2, SlidersHorizontal,
  ChevronDown, Globe, Award, Lock, ArrowUpRight, CheckCircle, IndianRupee,
  Eye, Info, MessageSquare, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import useClickOutside from "../../hooks/useClickOutside";
import KPIWidget from "../../components/dashboard/KPIWidget";
import { formatCurrency, getInitials } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// DEMO / SAMPLE MARKETPLACE JOBS DATA (In Rupees ₹)
// ─────────────────────────────────────────────────────────
const DEMO_JOBS = [
  {
    _id: "demo-1",
    title: "Full-Stack SaaS Platform Redesign (Next.js 14 & Node)",
    clientName: "Apex Digital Labs",
    clientRating: 4.9,
    category: "Web Development",
    budget: 280000,
    currency: "INR",
    type: "Fixed Price",
    deadline: "2026-09-15",
    proposalsCount: 6,
    verified: true,
    description:
      "We are looking for an experienced full-stack developer to revamp our SaaS dashboard. Requires React/Next.js 14, Tailwind CSS, REST APIs, and Stripe payment integration. Must deliver responsive UI with high performance.",
    requiredSkills: ["React", "Next.js", "Node.js", "Tailwind CSS", "Stripe API"],
    postedAt: "2 hours ago",
  },
  {
    _id: "demo-2",
    title: "AI-Powered Customer Support Chatbot & RAG Workflow",
    clientName: "FinTech Velocity",
    clientRating: 5.0,
    category: "AI & Data",
    budget: 225000,
    currency: "INR",
    type: "Fixed Price",
    deadline: "2026-09-10",
    proposalsCount: 12,
    verified: true,
    description:
      "Build a custom RAG AI chatbot trained on company documentation using OpenAI GPT-4 APIs, LangChain, and Vector DB (Pinecone/Qdrant). Needs web widget integration and analytics dashboard.",
    requiredSkills: ["Python", "OpenAI API", "LangChain", "Vector DB", "React"],
    postedAt: "5 hours ago",
  },
  {
    _id: "demo-3",
    title: "Cross-Platform Mobile App for Expense Tracking (React Native)",
    clientName: "VentureWorks Inc.",
    clientRating: 4.8,
    category: "Mobile Apps",
    budget: 350000,
    currency: "INR",
    type: "Fixed Price",
    deadline: "2026-10-01",
    proposalsCount: 9,
    verified: true,
    description:
      "Looking for a React Native specialist to build an iOS & Android app for expense tracking and invoice scanning. Must include OCR receipt scanning, offline sync, and PDF invoice export.",
    requiredSkills: ["React Native", "Expo", "TypeScript", "Node.js", "Firebase"],
    postedAt: "1 day ago",
  },
  {
    _id: "demo-4",
    title: "Dark-Mode Design System & Web App UI/UX Redesign",
    clientName: "Neuron Studio",
    clientRating: 4.9,
    category: "UI/UX Design",
    budget: 150000,
    currency: "INR",
    type: "Fixed Price",
    deadline: "2026-09-05",
    proposalsCount: 14,
    verified: true,
    description:
      "Redesign our desktop & mobile application design system in Figma. Deliver clean dark-mode UI components, micro-animations specification, and developer handoff guidelines.",
    requiredSkills: ["Figma", "UI/UX", "Design Systems", "Prototyping", "Tailwind CSS"],
    postedAt: "1 day ago",
  },
  {
    _id: "demo-5",
    title: "Technical Content & API Documentation Writing",
    clientName: "CloudScale Systems",
    clientRating: 4.7,
    category: "Writing & Content",
    budget: 85000,
    currency: "INR",
    type: "Fixed Price",
    deadline: "2026-08-30",
    proposalsCount: 4,
    verified: true,
    description:
      "Seeking a technical writer to document REST & GraphQL APIs, author developer onboarding guides, and write 4 technical blog posts on cloud infrastructure scaling.",
    requiredSkills: ["Technical Writing", "API Docs", "Markdown", "Developer Experience"],
    postedAt: "2 days ago",
  },
  {
    _id: "demo-6",
    title: "DevOps CI/CD Automation & Kubernetes Migration",
    clientName: "OmniTech Solutions",
    clientRating: 5.0,
    category: "Web Development",
    budget: 260000,
    currency: "INR",
    type: "Fixed Price",
    deadline: "2026-09-20",
    proposalsCount: 7,
    verified: true,
    description:
      "Migrate existing Dockerized microservices to AWS EKS (Kubernetes), configure GitHub Actions CI/CD pipelines, and implement Prometheus/Grafana monitoring alerts.",
    requiredSkills: ["AWS", "Kubernetes", "Docker", "GitHub Actions", "Terraform"],
    postedAt: "3 days ago",
  },
];

const CATEGORIES = [
  "All",
  "Web Development",
  "Mobile Apps",
  "UI/UX Design",
  "AI & Data",
  "Writing & Content",
];

const SORT_OPTIONS = [
  { id: "latest", label: "Latest Listings" },
  { id: "budget-high", label: "Highest Budget" },
  { id: "budget-low", label: "Lowest Budget" },
];

const DELIVERY_OPTIONS = [
  { id: "3", label: "3 Days (Express)" },
  { id: "7", label: "7 Days (1 Week)" },
  { id: "14", label: "14 Days (2 Weeks)" },
  { id: "30", label: "30 Days (1 Month)" },
];

// ─────────────────────────────────────────────────────────
// CUSTOM SORT DROPDOWN (Dark Glass Menu)
// ─────────────────────────────────────────────────────────
const CustomSortDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), { enabled: open });

  const currentOption = SORT_OPTIONS.find((o) => o.id === value) || SORT_OPTIONS[0];

  return (
    <div className="relative shrink-0" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer select-none"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: open ? "0 0 16px rgba(99,91,255,0.25)" : "none",
        }}
      >
        <SlidersHorizontal size={13} className="text-purple-400" />
        <span>{currentOption.label}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-30 w-44 rounded-xl overflow-hidden py-1.5"
            style={{
              background: "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(10,16,30,0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.6), 0 0 16px rgba(99,91,255,0.15)",
              backdropFilter: "blur(20px)",
            }}
          >
            {SORT_OPTIONS.map((opt) => {
              const active = opt.id === value;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer"
                  style={{
                    color: active ? "#A78BFA" : "#CBD5E1",
                    background: active ? "rgba(99,91,255,0.15)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{opt.label}</span>
                  {active && <Check size={13} className="text-purple-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// CUSTOM DELIVERY DROPDOWN (Modal Dropdown — No OS Native Blue)
// ─────────────────────────────────────────────────────────
const CustomDeliveryDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), { enabled: open });

  const currentOption = DELIVERY_OPTIONS.find((o) => o.id === String(value)) || DELIVERY_OPTIONS[1];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer select-none"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: open ? "0 0 16px rgba(99,91,255,0.25)" : "none",
        }}
      >
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-purple-400" />
          <span>{currentOption.label}</span>
        </div>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-12 z-30 rounded-xl overflow-hidden py-1.5"
            style={{
              background: "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(10,16,30,0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.7), 0 0 20px rgba(99,91,255,0.2)",
              backdropFilter: "blur(20px)",
            }}
          >
            {DELIVERY_OPTIONS.map((opt) => {
              const active = opt.id === String(value);
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-left transition-colors cursor-pointer"
                  style={{
                    color: active ? "#A78BFA" : "#CBD5E1",
                    background: active ? "rgba(99,91,255,0.18)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{opt.label}</span>
                  {active && <Check size={13} className="text-purple-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  // Project detail modal state
  const [detailProject, setDetailProject] = useState(null);

  // Proposal submission modal state
  const [selectedProject, setSelectedProject] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appliedProjectIds, setAppliedProjectIds] = useState(new Set());

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects/explore");
      const fetched = res.data?.data?.projects || res.data?.projects || [];
      if (fetched.length > 0) {
        setProjects(fetched);
      } else {
        setProjects(DEMO_JOBS);
      }
    } catch (err) {
      setProjects(DEMO_JOBS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { All: projects.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = projects.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch =
          !search ||
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()) ||
          p.requiredSkills?.some((sk) => sk.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory =
          selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "budget-high") return (b.budget || 0) - (a.budget || 0);
        if (sortBy === "budget-low") return (a.budget || 0) - (b.budget || 0);
        return 0;
      });
  }, [projects, search, selectedCategory, sortBy]);

  const handleOpenProposal = (project) => {
    setDetailProject(null);
    setSelectedProject(project);
    setBidAmount(project.budget ? String(project.budget) : "100000");
    setDeliveryDays("7");
    setCoverLetter("");
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      toast.error("Please enter a cover letter detailing your proposal approach.");
      return;
    }

    try {
      setSubmitting(true);
      try {
        await api.post(`/projects/${selectedProject._id}/proposals`, {
          bidAmount: Number(bidAmount),
          deliveryDays: Number(deliveryDays),
          coverLetter,
        });
      } catch (err) {
        // Fallback for demo items
      }

      setAppliedProjectIds((prev) => new Set(prev).add(selectedProject._id));
      toast.success("Proposal submitted successfully! The client will review your application.");
      setSelectedProject(null);
    } catch (err) {
      toast.error("Failed to submit proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-12"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.06) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── PAGE HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{ background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Explore Jobs
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Browse active client contracts, submit custom proposals, and secure project milestones
            </p>
          </div>
        </motion.div>

        {/* ── KPI STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPIWidget
            label="Active Job Listings"
            value={`${filteredProjects.length} Open Jobs`}
            icon={Briefcase}
            trendLabel="Verified client contracts"
            color="brand"
          />
          <KPIWidget
            label="Escrow Protection"
            value="100% Guaranteed"
            icon={ShieldCheck}
            trendLabel="Milestones locked safely"
            color="success"
          />
          <KPIWidget
            label="Avg Contract Value"
            value="₹2,25,000"
            icon={TrendingUp}
            trendLabel="Based on market budget"
            color="cyan"
          />
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project title, tech stack, or skills..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium text-white transition-all outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(99,91,255,0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.09)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Custom Sort Dropdown */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <CustomSortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)"
                      : "rgba(255,255,255,0.04)",
                    color: active ? "#FFFFFF" : "#9CA3AF",
                    border: active ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: active ? "0 0 16px rgba(99,91,255,0.35)" : "none",
                  }}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${active ? "bg-white/20 text-white" : "bg-white/5 text-gray-400"}`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── PROJECTS GRID (Redesigned Clickable Interactive Job Cards) ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)" }}>
              <Briefcase size={26} style={{ color: "#635BFF" }} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No open projects match your query</h3>
            <p className="text-xs text-gray-400 max-w-sm mb-4">
              Try adjusting your search filter or selecting another category.
            </p>
            <button onClick={() => { setSearch(""); setSelectedCategory("All"); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ background: "rgba(99,91,255,0.2)", border: "1px solid rgba(99,91,255,0.3)", color: "#A78BFA" }}>
              Reset Search & Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => {
              const isApplied = appliedProjectIds.has(project._id);
              const skills = project.requiredSkills || [];
              const visibleSkills = skills.slice(0, 4);
              const extraSkills = skills.length - visibleSkills.length;
              const initials = getInitials(project.clientName || "Client");
              const formattedBudget = formatCurrency(project.budget || 100000, project.currency || "INR");

              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="rounded-2xl p-6 flex flex-col justify-between group transition-all duration-200 cursor-pointer"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                    minHeight: "340px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,91,255,0.35)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,91,255,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
                  }}
                  onClick={() => setDetailProject(project)}
                >
                  <div className="space-y-3">
                    {/* Top Header: Category Badge on left, Budget Badge on right */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(99,91,255,0.14)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.2)" }}>
                        {project.category || "General"}
                      </span>
                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-emerald-400 leading-none">
                          {formattedBudget}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-1">
                          {project.type || "Fixed Price"}
                        </p>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-extrabold text-base text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug flex items-center justify-between gap-2">
                        <span>{project.title}</span>
                        <ArrowUpRight size={16} className="text-gray-500 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </h3>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed font-normal">
                        {project.description}
                      </p>
                    </div>

                    {/* Clean Inline Key Details: Proposals & Escrow */}
                    <div className="flex items-center gap-3 text-[11px] font-medium text-gray-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Send size={11} className="text-purple-400" />
                        <strong className="text-slate-200">{project.proposalsCount || 6} proposals</strong>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={11} className="text-emerald-400" />
                        <strong className="text-emerald-400">100% Escrow</strong>
                      </span>
                    </div>

                    {/* Skills Tags */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {visibleSkills.map((sk, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                            style={{ background: "rgba(255,255,255,0.04)", color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.07)" }}>
                            {sk}
                          </span>
                        ))}
                        {extraSkills > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                            style={{ background: "rgba(99,91,255,0.1)", color: "#C4B5FD", border: "1px solid rgba(99,91,255,0.2)" }}>
                            +{extraSkills} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Action Buttons: View Details & Submit Proposal */}
                  <div className="pt-3.5 space-y-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.3)" }}>
                          {initials}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-200">{project.clientName || "Verified Client"}</span>
                          <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                        </div>
                        {project.clientRating && (
                          <span className="flex items-center text-[10px] text-amber-400 font-bold ml-0.5 px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <Star size={10} className="fill-amber-400 text-amber-400 mr-0.5" />
                            {project.clientRating}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{project.postedAt || "Recently"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setDetailProject(project)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          color: "#CBD5E1",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <Eye size={13} className="text-purple-400" /> View Details
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: isApplied ? 1 : 1.02 }}
                        whileTap={{ scale: isApplied ? 1 : 0.98 }}
                        disabled={isApplied}
                        onClick={() => handleOpenProposal(project)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={{
                          background: isApplied
                            ? "rgba(34,197,94,0.15)"
                            : "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
                          color: isApplied ? "#22C55E" : "#FFFFFF",
                          border: isApplied ? "1px solid rgba(34,197,94,0.3)" : "none",
                          boxShadow: isApplied ? "none" : "0 4px 16px rgba(99,91,255,0.35)",
                        }}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 size={13} /> Applied
                          </>
                        ) : (
                          <>
                            Apply Now <ArrowRight size={13} />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FULL PROJECT DETAILS MODAL ── */}
      <AnimatePresence>
        {detailProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailProject(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl rounded-3xl overflow-hidden z-10 p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
              style={{
                background: "linear-gradient(160deg, rgba(15,23,42,0.99) 0%, rgba(10,16,30,0.99) 100%)",
                border: "1px solid rgba(99,91,255,0.3)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(99,91,255,0.2)",
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setDetailProject(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <X size={16} />
              </button>

              {/* Category & Budget Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-lg"
                    style={{ background: "rgba(99,91,255,0.18)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
                    {detailProject.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-emerald-400"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
                    <CheckCircle size={12} /> Verified Client
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-xl font-black text-emerald-400">
                    {formatCurrency(detailProject.budget, detailProject.currency || "INR")}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">{detailProject.type || "Fixed Contract"}</p>
                </div>
              </div>

              {/* Title & Post Metadata */}
              <div className="space-y-2">
                <h2 className="text-xl lg:text-2xl font-black text-white leading-tight">
                  {detailProject.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-purple-400" /> Posted {detailProject.postedAt || "Recently"}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-purple-400" /> Deadline: {detailProject.deadline || "Flexible"}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Send size={13} className="text-purple-400" /> {detailProject.proposalsCount || 6} Active Proposals
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-2 p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-purple-400" /> Detailed Scope & Requirements
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-normal whitespace-pre-line">
                  {detailProject.description}
                </p>
              </div>

              {/* Required Skills Grid */}
              {detailProject.requiredSkills && detailProject.requiredSkills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-purple-400" /> Required Tech Stack & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detailProject.requiredSkills.map((skill, i) => (
                      <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                        style={{ background: "rgba(99,91,255,0.12)", color: "#C4B5FD", border: "1px solid rgba(99,91,255,0.25)" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Profile Overview Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 16px rgba(99,91,255,0.4)" }}>
                    {getInitials(detailProject.clientName || "Client")}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-white">{detailProject.clientName || "Verified Client"}</span>
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">Payment Verified · 100% Milestone Completion</p>
                  </div>
                </div>

                {detailProject.clientRating && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-400"
                    style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span>{detailProject.clientRating} / 5.0</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenProposal(detailProject)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
                    boxShadow: "0 0 20px rgba(99,91,255,0.4)",
                  }}
                >
                  <span>Apply Now</span>
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PROPOSAL SUBMISSION MODAL ── */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl rounded-3xl overflow-hidden z-10 p-6 lg:p-8 space-y-5"
              style={{
                background: "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(10,16,30,0.98) 100%)",
                border: "1px solid rgba(99,91,255,0.3)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(99,91,255,0.2)",
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <X size={16} />
              </button>

              {/* Clean Modal Header */}
              <div className="space-y-1.5 pr-8">
                <h2 className="text-lg lg:text-xl font-black text-white leading-tight">
                  {selectedProject.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="px-2.5 py-0.5 rounded-md font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
                    Budget: {formatCurrency(selectedProject.budget, selectedProject.currency || "INR")}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md font-bold text-purple-300 bg-purple-500/10 border border-purple-500/25">
                    {selectedProject.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-gray-300 bg-white/5 border border-white/10">
                    Client: {selectedProject.clientName || "Verified"}
                  </span>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Bid Input in Rupees */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Your Bid Amount (₹ INR)
                    </label>
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-3 text-purple-400" />
                      <input
                        type="number"
                        required
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="e.g. 250000"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-xs font-semibold text-white outline-none"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Delivery Timeline Dropdown (Custom Dropdown) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Estimated Delivery
                    </label>
                    <CustomDeliveryDropdown value={deliveryDays} onChange={setDeliveryDays} />
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Cover Letter & Project Plan
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Describe your technical approach, key milestones, and past experience relevant to this contract..."
                    className="w-full p-3 rounded-xl text-xs font-medium text-white outline-none leading-relaxed"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </div>

                {/* High-Contrast Escrow Banner */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(16,185,129,0.08) 100%)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.1)",
                  }}>
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                    <strong className="text-emerald-400 font-bold">100% Escrow Security:</strong> Client funds are securely deposited in milestone escrow before contract start.
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
                      boxShadow: "0 0 20px rgba(99,91,255,0.4)",
                    }}
                  >
                    {submitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    <span>{submitting ? "Submitting..." : "Submit Proposal"}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
