import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Folder, Search, LayoutGrid, List,
  Trash2, Pencil, Calendar, DollarSign, ArrowRight,
  Sparkles, ChevronDown, ExternalLink, FolderKanban,
  Globe, Briefcase, FileText, Send, CheckCircle2, Clock,
  XCircle, Filter, Tag, Loader2, Check, X,
} from "lucide-react";
import useProjectStore from "../../store/projectStore";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { formatDate, formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";

// ── Glass Container Card (Client Portal Standard) ──────────────────────────
const GCard = ({ children, delay, className = "", glow, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${className}`}
    style={{
      background: "linear-gradient(145deg, rgba(15,23,42,0.85) 0%, rgba(9,14,26,0.92) 100%)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.09)",
      boxShadow: glow
        ? `0 10px 30px -10px ${glow}20, 0 0 20px ${glow}10`
        : "0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px rgba(99,91,255,0.05)",
    }}
  >
    {/* Top Shimmer Accent Line */}
    <div
      className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{
        background: glow
          ? `linear-gradient(90deg, transparent, ${glow}70, transparent)`
          : "linear-gradient(90deg, transparent, rgba(99,91,255,0.35), transparent)",
      }}
    />
    {children}
  </motion.div>
);

const STATUS_STYLE = {
  open:      { dot: "#38BDF8", bg: "rgba(56,189,248,0.12)",  text: "#38BDF8", label: "Open Bidding" },
  planning:  { dot: "#9CA3AF", bg: "rgba(156,163,175,0.12)", text: "#9CA3AF", label: "Planning"   },
  active:    { dot: "#22C55E", bg: "rgba(34,197,94,0.12)",   text: "#22C55E", label: "Active"     },
  on_hold:   { dot: "#F59E0B", bg: "rgba(245,158,11,0.12)",  text: "#F59E0B", label: "On Hold"    },
  completed: { dot: "#00D4FF", bg: "rgba(0,212,255,0.12)",   text: "#00D4FF", label: "Completed"  },
  cancelled: { dot: "#EF4444", bg: "rgba(239,68,68,0.12)",   text: "#EF4444", label: "Cancelled"  },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.planning;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide shrink-0"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}25` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }} />
      {s.label}
    </span>
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
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
  };
  const labelStyle = { color: "#9CA3AF", fontSize: "12px", fontWeight: 600, marginBottom: 6, display: "block" };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label style={labelStyle}>Project Title *</label>
        <input name="title" placeholder="e.g. Modern Full-Stack Web Application" value={form.title} onChange={set} required style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Description & Scope</label>
        <textarea name="description" placeholder="Describe key deliverables and objectives..." value={form.description} onChange={set} rows={3} style={{ ...inputStyle, resize: "none" }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Budget (₹ INR)</label>
          <input name="budget" type="number" min="0" placeholder="0" value={form.budget} onChange={set} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Target Deadline</label>
          <input name="deadline" type="date" value={form.deadline} onChange={set} style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-white/5 hover:bg-white/10 cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/30 cursor-pointer">
          {loading ? "Creating…" : "Create Project"}
        </button>
      </div>
    </form>
  );
};

// ── MAIN FREELANCER PROJECTS PAGE ──
const Projects = () => {
  const {
    projects, myProposals,
    fetchProjects, fetchMyProposals,
    createProject, deleteProject, isLoading
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState("my"); // "my" | "proposals"
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchMyProposals();
  }, []);

  const handleCreate = async (data) => {
    setCreating(true);
    await createProject(data);
    setCreating(false);
    setShowModal(false);
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    );
  });

  const filteredProposals = myProposals.filter((prop) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      prop.project?.title?.toLowerCase().includes(q) ||
      prop.coverLetter?.toLowerCase().includes(q) ||
      prop.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen relative overflow-hidden pb-12"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.06) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER & ACTION BUTTON ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 40%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.25))",
              }}>
              Freelancer Projects Workspace
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Manage active client projects and track submitted proposals
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shrink-0"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Personal Project</span>
          </motion.button>
        </motion.div>

        {/* ── KPI STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SubpageStatCard
            label="Total Projects"
            value={projects.length}
            icon={Folder}
            subtext="Personal & client projects"
            color="purple"
            delay={0}
          />
          <SubpageStatCard
            label="Active Workspaces"
            value={projects.filter((p) => p.status === "active" || p.status === "in_progress" || p.status === "planning").length}
            icon={FolderKanban}
            subtext="Currently in execution"
            color="green"
            delay={0.05}
          />
          <SubpageStatCard
            label="Completed"
            value={projects.filter((p) => p.status === "completed").length}
            icon={CheckCircle2}
            subtext="Delivered & signed off"
            color="cyan"
            delay={0.1}
          />
          <SubpageStatCard
            label="Submitted Bids"
            value={myProposals.length}
            icon={FileText}
            subtext="Proposals under review"
            color="amber"
            delay={0.15}
          />
        </div>

        {/* ── TOOLBAR: SEARCH BAR ON LEFT + TABS ON RIGHT ── */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === "my" ? "Search projects by title or description..." : "Search applications or proposals..."}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium text-white placeholder-slate-400 outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(99,91,255,0.5)";
                e.target.style.background = "rgba(99,91,255,0.06)";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                e.target.style.background = "rgba(255,255,255,0.04)";
                e.target.style.boxShadow = "none";
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setActiveTab("my")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "my"
                  ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-purple-300 border border-indigo-500/35 shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}>
              <FolderKanban size={15} />
              <span>My Active Projects ({projects.length})</span>
            </button>

            <button onClick={() => setActiveTab("proposals")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "proposals"
                  ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-purple-300 border border-indigo-500/35 shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}>
              <FileText size={15} />
              <span>My Applications ({myProposals.length})</span>
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT CONTAINER (Client Portal GCard) ── */}
        <GCard delay={0.2} glow="#635BFF" className="min-h-[320px] p-6">
          {activeTab === "my" && (
            <div>
              {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/10"
                    style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)" }}>
                    <FolderKanban size={26} className="text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {search ? "No projects match your search" : "No active projects found"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-5">
                    {search ? "Try clearing or adjusting your search term." : "Create a personal project or apply for open jobs in the Explore Jobs section."}
                  </p>
                  {search ? (
                    <button onClick={() => setSearch("")} className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all cursor-pointer">
                      Clear Search
                    </button>
                  ) : (
                    <Link to="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)", boxShadow: "0 0 20px rgba(99,91,255,0.35)" }}>
                      <Globe size={14} />
                      <span>Explore Jobs</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProjects.map((p) => (
                    <div key={p._id} className="rounded-2xl p-5 border transition-all duration-200 group flex flex-col justify-between space-y-4"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        backdropFilter: "blur(12px)",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)";
                        e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.4), 0 0 20px rgba(99,91,255,0.15)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={p.status} />
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${p.title}"? This will disconnect active client & freelancer connections.`)) {
                                deleteProject(p._id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 opacity-80 hover:opacity-100 transition-all cursor-pointer"
                            title="Delete project & disconnect"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <Link to={`/projects/${p._id}`} className="text-sm font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1">
                          {p.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description || "No description"}</p>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                          <span>Progress</span>
                          <span className="font-bold text-indigo-400">{p.progress || 0}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <div className="flex justify-between items-center mt-3 text-xs text-slate-400 pt-2.5 border-t border-white/5">
                          <span>Budget: <strong className="text-white">₹{p.budget?.toLocaleString() || 0}</strong></span>
                          <Link to={`/projects/${p._id}`} className="text-indigo-400 font-bold hover:underline flex items-center gap-1">
                            Open Workspace <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "proposals" && (
            <div>
              {filteredProposals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/10"
                    style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)" }}>
                    <FileText size={26} className="text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {search ? "No applications match your search" : "No applications submitted yet"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-5">
                    {search ? "Try clearing or adjusting your search term." : "Browse open client contracts in the Explore Jobs section to submit proposals."}
                  </p>
                  {search ? (
                    <button onClick={() => setSearch("")} className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all cursor-pointer">
                      Clear Search
                    </button>
                  ) : (
                    <Link to="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)", boxShadow: "0 0 20px rgba(99,91,255,0.35)" }}>
                      <Globe size={14} />
                      <span>Explore Jobs</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProposals.map((prop) => {
                    const p = prop.project || {};
                    const isApproved = prop.status === "approved";
                    const isRejected = prop.status === "rejected";

                    return (
                      <div key={prop._id} className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                        isApproved ? "border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/10" : "border-white/5 bg-slate-900/60"
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
        </GCard>

      </div>

      {/* MODALS */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Personal Project" description="Create a project for your workspace">
        <ProjectForm onSubmit={handleCreate} onClose={() => setShowModal(false)} loading={creating} />
      </Modal>
    </div>
  );
};

export default Projects;
