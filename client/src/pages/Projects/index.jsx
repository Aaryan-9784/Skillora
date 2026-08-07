import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Folder, Search, LayoutGrid, List,
  Trash2, Pencil, Calendar, DollarSign, ArrowRight,
  Sparkles, ChevronDown, ExternalLink, FolderKanban,
  Globe, Briefcase, FileText, Send, CheckCircle2, Clock,
  XCircle, Filter, Tag, Loader2, Check
} from "lucide-react";
import useProjectStore from "../../store/projectStore";
import Modal from "../../components/ui/Modal";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { formatDate, formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "",           label: "All statuses" },
  { value: "planning",   label: "Planning"     },
  { value: "active",     label: "Active"       },
  { value: "on_hold",    label: "On Hold"      },
  { value: "completed",  label: "Completed"    },
  { value: "cancelled",  label: "Cancelled"    },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "budget", label: "Highest budget" },
];

const STATUS_STYLE = {
  open:      { dot: "#38BDF8", bg: "rgba(56,189,248,0.12)",  text: "#38BDF8", label: "Open Bidding" },
  planning:  { dot: "#9CA3AF", bg: "rgba(156,163,175,0.12)", text: "#9CA3AF", label: "Planning"   },
  active:    { dot: "#22C55E", bg: "rgba(34,197,94,0.12)",   text: "#22C55E", label: "Active"     },
  on_hold:   { dot: "#F59E0B", bg: "rgba(245,158,11,0.12)",  text: "#F59E0B", label: "On Hold"    },
  completed: { dot: "#00D4FF", bg: "rgba(0,212,255,0.12)",   text: "#00D4FF", label: "Completed"  },
  cancelled: { dot: "#EF4444", bg: "rgba(239,68,68,0.12)",   text: "#EF4444", label: "Cancelled"  },
};

const CATEGORIES = [
  "All",
  "Web Development",
  "Mobile App Development",
  "UI/UX Design",
  "AI & Data Science",
  "Writing & Content",
  "Marketing & SEO",
  "General",
];

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.planning;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}25` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl p-5 animate-pulse"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
    <div className="flex items-start justify-between mb-4">
      <div className="h-4 w-2/3 rounded-lg bg-white/5" />
      <div className="h-6 w-16 rounded-full bg-white/5" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full rounded bg-white/5" />
      <div className="h-3 w-4/5 rounded bg-white/5" />
    </div>
    <div className="h-1.5 w-full rounded-full mb-4 bg-white/5" />
  </div>
);

// ── CUSTOM DARK GLASS DROPDOWN ──
const CustomDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = options.find((o) => (typeof o === "string" ? o === value : o.value === value)) || options[0];
  const getLabel = (o) => (typeof o === "string" ? o : o.label);
  const getVal = (o) => (typeof o === "string" ? o : o.value);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 px-3.5 rounded-xl text-xs font-semibold text-white flex items-center justify-between gap-2.5 transition-all cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: open ? "1px solid rgba(99,91,255,0.45)" : "1px solid rgba(255,255,255,0.09)",
        }}
      >
        <span>{getLabel(selected)}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 text-slate-400 ${open ? "rotate-180 text-indigo-400" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 z-50 w-44 p-1.5 rounded-xl border border-slate-700/80 shadow-2xl space-y-0.5 backdrop-blur-xl"
            style={{ background: "rgba(13,21,38,0.96)" }}>
            {options.map((o) => {
              const val = getVal(o);
              const isSel = val === value;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-all cursor-pointer ${
                    isSel ? "bg-indigo-600/30 text-white font-bold border border-indigo-500/40" : "hover:bg-white/10 text-slate-300"
                  }`}>
                  <span>{getLabel(o)}</span>
                  {isSel && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── APPLY PROPOSAL MODAL ──
const ApplyProposalModal = ({ project, onClose }) => {
  const { submitProposal } = useProjectStore();
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount]   = useState(project?.budget || "");
  const [currency, setCurrency]     = useState(project?.currency || "USD");
  const [estimatedDays, setDays]    = useState(7);
  const [loading, setLoading]       = useState(false);

  if (!project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim() || !bidAmount) {
      toast.error("Please provide a cover letter and proposed bid amount");
      return;
    }
    setLoading(true);
    try {
      await submitProposal(project._id, {
        coverLetter: coverLetter.trim(),
        bidAmount: Number(bidAmount),
        currency,
        estimatedDays: Number(estimatedDays),
      });
      onClose();
    } catch {
      /* handled in store */
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

        <motion.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
          className="relative w-full max-w-xl rounded-3xl overflow-hidden z-10 p-6 sm:p-8"
          style={{
            background: "linear-gradient(160deg,rgba(15,23,42,0.98) 0%,rgba(8,14,26,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(99,91,255,0.15)",
          }}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-black text-white">Submit Proposal</h2>
              <p className="text-xs text-indigo-400 font-semibold truncate max-w-md">{project.title}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
              <XCircle size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Posted Budget:</span>
                <span className="font-bold text-white">{project.currency === "INR" ? "₹" : "$"}{project.budget?.toLocaleString()}</span>
              </div>
              {project.category && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-200">{project.category}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Proposed Bid *</label>
                <input type="number" required min="1" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="1500" className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white outline-none focus:border-indigo-500">
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Est. Days *</label>
                <input type="number" required min="1" value={estimatedDays} onChange={(e) => setDays(e.target.value)}
                  placeholder="7" className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Cover Letter & Approach *</label>
              <textarea required rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you are the best fit for this project, your experience, relevant work samples, and proposed workflow..."
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-indigo-500 leading-relaxed resize-none" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 cursor-pointer disabled:opacity-50">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>Submit Proposal</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ── NEW PROJECT FORM MODAL ──
const ProjectForm = ({ onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    title: "", description: "", budget: "", deadline: "", status: "planning",
  });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F9FAFB",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };
  const labelStyle = { color: "#9CA3AF", fontSize: "12px", fontWeight: 600, marginBottom: 6, display: "block" };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label style={labelStyle}>Project title *</label>
        <input name="title" placeholder="e.g. Brand Redesign" value={form.title} onChange={set} required style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea name="description" placeholder="What's this project about?" value={form.description} onChange={set} rows={3} style={{ ...inputStyle, resize: "none" }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Budget (₹)</label>
          <input name="budget" type="number" min="0" placeholder="0" value={form.budget} onChange={set} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Deadline</label>
          <input name="deadline" type="date" value={form.deadline} onChange={set} style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-slate-400 bg-white/5 hover:bg-white/10">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md">
          {loading ? "Creating…" : "Create Project"}
        </button>
      </div>
    </form>
  );
};

// ── MAIN FREELANCER PROJECTS PAGE ──
const Projects = () => {
  const {
    projects, openProjects, myProposals,
    fetchProjects, fetchOpenProjects, fetchMyProposals,
    createProject, deleteProject, isLoading
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState("my"); // "my" | "marketplace" | "proposals"
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [search, setSearch]       = useState("");
  const [categoryFilter, setCategory] = useState("All");
  const [applyProject, setApplyProject] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchOpenProjects();
    fetchMyProposals();
  }, []);

  const handleCreate = async (data) => {
    setCreating(true);
    await createProject(data);
    setCreating(false);
    setShowModal(false);
  };

  const filteredMarketplace = openProjects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER & TAB BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{ background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Freelancer Projects & Marketplace
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Manage active client projects, explore open opportunities, and track submitted proposals
            </p>
          </div>

          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 cursor-pointer">
            <Plus size={16} />
            <span>Create Personal Project</span>
          </button>
        </div>

        {/* ── MAIN PORTAL NAVIGATION TABS ── */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 w-fit">
          <button onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "my"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}>
            <FolderKanban size={15} />
            <span>My Active Projects ({projects.length})</span>
          </button>

          <button onClick={() => setActiveTab("marketplace")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "marketplace"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}>
            <Globe size={15} />
            <span>Explore Marketplace ({openProjects.length})</span>
          </button>

          <button onClick={() => setActiveTab("proposals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "proposals"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}>
            <FileText size={15} />
            <span>My Applications ({myProposals.length})</span>
          </button>
        </div>

        {/* ── TAB 1: MY ACTIVE PROJECTS ── */}
        {activeTab === "my" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {projects.map((p) => (
                <div key={p._id} className="rounded-2xl p-5 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all group flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={p.status} />
                      <button onClick={() => deleteProject(p._id)} className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Link to={`/projects/${p._id}`} className="text-sm font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1">
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description || "No description"}</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-bold text-indigo-400">{p.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>Budget: <strong className="text-white">₹{p.budget?.toLocaleString() || 0}</strong></span>
                      <Link to={`/projects/${p._id}`} className="text-indigo-400 font-bold hover:underline flex items-center gap-1">
                        Open Workspace <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: EXPLORE MARKETPLACE ── */}
        {activeTab === "marketplace" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search open client projects..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-950/80 border border-slate-800 text-white outline-none focus:border-indigo-500" />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400 ml-1" />
                <CustomDropdown value={categoryFilter} onChange={setCategory} options={CATEGORIES} />
              </div>
            </div>

            {/* Marketplace Grid */}
            {filteredMarketplace.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 text-center space-y-3">
                <Globe size={32} className="text-indigo-400 opacity-60" />
                <p className="text-base font-bold text-white">No open client projects match filters</p>
                <p className="text-xs text-slate-400 max-w-sm">Client projects will appear here as soon as clients post them.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredMarketplace.map((p) => {
                  const client = p.clientUser || p.clientId || {};
                  return (
                    <div key={p._id} className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all flex flex-col justify-between space-y-4">
                      <div>
                        {/* Client Identity Header */}
                        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs overflow-hidden shrink-0">
                            {client.avatar ? <img src={client.avatar} className="w-full h-full object-cover" /> : client.name?.slice(0, 2).toUpperCase() || "CL"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{client.name || "Client"}</p>
                            <p className="text-[10px] text-slate-400 truncate">{client.company || "Client Enterprise"}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {p.category || "Project"}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white mb-2 leading-snug">{p.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">{p.description}</p>

                        {/* Skills Required */}
                        {p.requiredSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {p.requiredSkills.map((sk) => (
                              <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/50">
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer & Apply Action */}
                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Budget: <strong className="text-emerald-400 font-black">{p.currency === "INR" ? "₹" : "$"}{p.budget?.toLocaleString() || "Negotiable"}</strong></span>
                          <span className="text-slate-400">{p.proposalsCount || 0} proposals</span>
                        </div>

                        <button onClick={() => setApplyProject(p)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer">
                          <Send size={14} />
                          <span>Apply & Submit Proposal</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: MY APPLICATIONS ── */}
        {activeTab === "proposals" && (
          <div className="space-y-4">
            {myProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 text-center space-y-3">
                <FileText size={32} className="text-slate-500" />
                <p className="text-base font-bold text-white">No applications submitted yet</p>
                <p className="text-xs text-slate-400 max-w-sm">Switch to the "Explore Marketplace" tab to find client projects and apply.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myProposals.map((prop) => {
                  const p = prop.project || {};
                  const isApproved = prop.status === "approved";
                  const isRejected = prop.status === "rejected";

                  return (
                    <div key={prop._id} className={`p-5 rounded-2xl bg-slate-900/80 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isApproved ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-800"
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{p.title || "Client Project"}</h4>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isApproved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                            isRejected ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                            "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                            {isApproved ? "Approved 🎉" : isRejected ? "Rejected" : "Pending Client Review"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{prop.coverLetter}</p>
                      </div>

                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div>
                          <p className="text-sm font-black text-emerald-400">{prop.currency === "INR" ? "₹" : "$"}{prop.bidAmount?.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{prop.estimatedDays} days timeframe</p>
                        </div>
                        {isApproved && (
                          <Link to={`/projects/${p._id}`} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md">
                            Go to Project
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODALS */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Personal Project" description="Create a project for your workspace">
        <ProjectForm onSubmit={handleCreate} onClose={() => setShowModal(false)} loading={creating} />
      </Modal>

      <ApplyProposalModal project={applyProject} onClose={() => setApplyProject(null)} />
    </div>
  );
};

export default Projects;
