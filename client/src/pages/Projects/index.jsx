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
import Select from "../../components/ui/Select";
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
    projects, myProposals,
    fetchProjects, fetchMyProposals,
    createProject, deleteProject, isLoading
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState("my"); // "my" | "proposals"
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

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER & ACTION BUTTON ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 cursor-pointer">
            <Plus size={16} />
            <span>Create Personal Project</span>
          </button>
        </div>

        {/* ── STAT CARDS ROW ── */}
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
              {projects.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 text-center space-y-3">
                  <FolderKanban size={32} className="text-slate-500" />
                  <p className="text-base font-bold text-white">No active projects found</p>
                  <p className="text-xs text-slate-400 max-w-sm">Create a personal project or apply for open jobs in the Explore Jobs section.</p>
                  <Link to="/marketplace" className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md">
                    <Globe size={14} />
                    <span>Explore Jobs</span>
                  </Link>
                </div>
              ) : (
                projects.map((p) => (
                  <div key={p._id} className="rounded-2xl p-5 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all group flex flex-col justify-between space-y-4">
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
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: MY APPLICATIONS ── */}
        {activeTab === "proposals" && (
          <div className="space-y-4">
            {myProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 text-center space-y-3">
                <FileText size={32} className="text-slate-500" />
                <p className="text-base font-bold text-white">No applications submitted yet</p>
                <p className="text-xs text-slate-400 max-w-sm">Browse open client contracts in the Explore Jobs section to submit proposals.</p>
                <Link to="/marketplace" className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md">
                  <Globe size={14} />
                  <span>Explore Jobs</span>
                </Link>
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
    </div>
  );
};

export default Projects;
