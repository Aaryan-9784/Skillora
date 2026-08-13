import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Search, Mail, Building2,
  Phone, Trash2, Pencil, LayoutGrid, List,
  ExternalLink, Folder, DollarSign, X, FolderKanban,
} from "lucide-react";
import useClientStore from "../../store/clientStore";
import useDebounce from "../../hooks/useDebounce";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { getInitials, formatCurrency } from "../../utils/helpers";

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

// ─────────────────────────────────────────────────────────
// SHARED INPUT STYLES
// ─────────────────────────────────────────────────────────
const iStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F9FAFB",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const lStyle = { color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };
const iFocus = (e) => { e.target.style.border = "1px solid rgba(99,91,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)"; };
const iBlur  = (e) => { e.target.style.border = "1px solid rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; };

// ─────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl p-5 animate-pulse"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="space-y-2 flex-1">
        <div className="h-3.5 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-3 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="h-3 w-3/4 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
    <div className="flex justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {[1,2,3].map(i => <div key={i} className="h-8 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }} />)}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// EMPTY STATE (Inside GCard Container)
// ─────────────────────────────────────────────────────────
const EmptyState = ({ hasSearch, onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/10"
      style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)" }}>
      <Users size={26} className="text-indigo-400" />
    </div>
    {hasSearch ? (
      <>
        <h3 className="text-base font-bold text-white mb-1">No clients found</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Try a different search term to find your clients in the directory.
        </p>
      </>
    ) : (
      <>
        <h3 className="text-base font-bold text-white mb-1">No clients yet</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-5">
          Add your first client to manage projects, invoices, and relationships all in one place.
        </p>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,91,255,0.4)" }}
          whileTap={{ scale: 0.96 }}
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <Plus size={15} strokeWidth={2.5} />
          <span>Add your first client</span>
        </motion.button>
      </>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────
// CLIENT CARD (grid view)
// ─────────────────────────────────────────────────────────
const ClientCard = ({ client, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.25 }}
    className="rounded-2xl p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-200"
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(12px)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)";
      e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.4), 0 0 20px rgba(99,91,255,0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {/* Top Shimmer Line on Hover */}
    <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style={{ background: "linear-gradient(90deg, transparent, #635BFF, transparent)" }} />

    <div>
      {/* Avatar + Name + Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-md shadow-indigo-500/20"
            style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)" }}>
            {getInitials(client.name)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white truncate group-hover:text-purple-300 transition-colors">
              {client.name}
            </h4>
            {client.company && (
              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                <Building2 size={11} className="text-indigo-400" />
                {client.company}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button onClick={() => onEdit(client)} title="Edit client"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(client._id)} title="Delete client"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-1.5 mb-4 text-xs text-slate-400 font-medium">
        {client.email && (
          <p className="truncate flex items-center gap-2">
            <Mail size={12} className="text-indigo-400 shrink-0" />
            <a href={`mailto:${client.email}`} className="hover:text-white transition-colors">{client.email}</a>
          </p>
        )}
        {client.phone && (
          <p className="truncate flex items-center gap-2">
            <Phone size={12} className="text-indigo-400 shrink-0" />
            <span>{client.phone}</span>
          </p>
        )}
      </div>
    </div>

    {/* Metrics Footer */}
    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-xs">
      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Projects</span>
        <span className="font-bold text-white text-xs">{client.projectsCount || 0}</span>
      </div>
      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Value</span>
        <span className="font-bold text-emerald-400 text-xs">{formatCurrency(client.totalRevenue || 0, "INR")}</span>
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// CLIENT ROW (list view)
// ─────────────────────────────────────────────────────────
const ClientRow = ({ client, index, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ delay: index * 0.02 }}
    className="flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer"
  >
    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
      style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)" }}>
      {getInitials(client.name)}
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-white truncate">{client.name}</p>
      <p className="text-[11px] text-slate-400 truncate">{client.email || "No email"}</p>
    </div>

    <div className="w-32 hidden sm:block truncate text-xs text-slate-400 font-medium">
      {client.company || "—"}
    </div>

    <div className="w-20 hidden md:block text-xs font-bold text-white text-center">
      {client.projectsCount || 0}
    </div>

    <div className="w-24 text-xs font-black text-emerald-400 text-right">
      {formatCurrency(client.totalRevenue || 0, "INR")}
    </div>

    <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onEdit(client)} className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer">
        <Pencil size={13} />
      </button>
      <button onClick={() => onDelete(client._id)} className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer">
        <Trash2 size={13} />
      </button>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// CLIENT FORM MODAL
// ─────────────────────────────────────────────────────────
const ClientForm = ({ initial = {}, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    name: initial.name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    company: initial.company || "",
    address: initial.address || "",
    notes: initial.notes || "",
  });

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label style={lStyle}>Client / Organization Name *</label>
        <input name="name" placeholder="e.g. Acme Corporation" value={form.name} onChange={set}
          required style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={lStyle}>Email Address</label>
          <input name="email" type="email" placeholder="client@acme.com" value={form.email} onChange={set}
            style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
        <div>
          <label style={lStyle}>Phone Number</label>
          <input name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={set}
            style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>

      <div>
        <label style={lStyle}>Company Name</label>
        <input name="company" placeholder="Acme Corp LLC" value={form.company} onChange={set}
          style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>

      <div>
        <label style={lStyle}>Internal Notes</label>
        <textarea name="notes" placeholder="Billing preferences, key contacts..." value={form.notes} onChange={set}
          rows={3} style={{ ...iStyle, resize: "none" }} onFocus={iFocus} onBlur={iBlur} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-white/5 hover:bg-white/10 cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/30 cursor-pointer">
          {loading ? "Saving…" : initial._id ? "Save Changes" : "Create Client"}
        </button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────
// CLIENT MODAL WRAPPER
// ─────────────────────────────────────────────────────────
const ClientModal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }} className="relative w-full max-w-md rounded-3xl overflow-hidden z-10 shadow-2xl"
          style={{
            background: "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(10,16,30,0.98) 100%)",
            backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)",
          }}>
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-base font-black text-white">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// CONFIRM DELETE DIALOG
// ─────────────────────────────────────────────────────────
const ConfirmDelete = ({ open, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onCancel} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm rounded-3xl p-6 z-10 space-y-4 text-center"
          style={{ background: "rgba(15,23,42,0.98)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Trash2 size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Delete Client Profile</h3>
            <p className="text-xs text-slate-400 mt-1">Are you sure? This client profile and associated history will be deleted.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-white/5 hover:bg-white/10 cursor-pointer">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer">Delete</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// MAIN CLIENTS PAGE
// ─────────────────────────────────────────────────────────
const Clients = () => {
  const { clients, fetchClients, createClient, updateClient, deleteClient, isLoading } = useClientStore();
  const [search, setSearch]               = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [view, setView]                   = useState("grid");
  const [modal, setModal]                 = useState(null);
  const [deleteId, setDeleteId]           = useState(null);
  const [saving, setSaving]               = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchClients(debouncedSearch);
  }, [debouncedSearch]);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (modal?._id) {
        await updateClient(modal._id, form);
      } else {
        await createClient(form);
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const hasSearch = Boolean(debouncedSearch);
  const totalProjectsLinked = clients.reduce((acc, c) => acc + (c.projectsCount || 0), 0);
  const totalRevenueGenerated = clients.reduce((acc, c) => acc + (c.totalRevenue || 0), 0);

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
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 40%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.25))",
              }}>
              Client Management
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Manage client relationships, contact profiles, linked projects & billing history
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shrink-0"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Client</span>
          </motion.button>
        </motion.div>

        {/* ── KPI METRICS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SubpageStatCard label="Total Clients" value={clients.length} icon={Users} subtext="Active CRM directory" color="purple" delay={0} />
          <SubpageStatCard label="Active Contacts" value={clients.length} icon={Building2} subtext="Verified client accounts" color="green" delay={0.05} />
          <SubpageStatCard label="Projects Linked" value={totalProjectsLinked} icon={Folder} subtext="Combined client projects" color="cyan" delay={0.1} />
          <SubpageStatCard label="Total Client Value" value={formatCurrency(totalRevenueGenerated, "INR")} icon={DollarSign} subtext="Invoiced & received" color="amber" delay={0.15} />
        </div>

        {/* ── SEARCH & VIEW TOGGLE TOOLBAR ── */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, company, or email..."
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

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[["grid", LayoutGrid], ["list", List]].map(([v, Icon]) => (
              <motion.button key={v} onClick={() => setView(v)} whileTap={{ scale: 0.92 }}
                className="w-8 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{
                  background: view === v ? "rgba(99,91,255,0.2)" : "transparent",
                  color: view === v ? "#A78BFA" : "#64748B",
                  border: view === v ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                }}>
                <Icon size={14} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT CONTAINER (Client Portal GCard) ── */}
        <GCard delay={0.2} glow="#635BFF" className="min-h-[320px] p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : clients.length === 0 ? (
            <EmptyState hasSearch={hasSearch} onAdd={() => setModal("create")} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {clients.map((c) => (
                  <ClientCard key={c._id} client={c}
                    onEdit={(cl) => setModal(cl)}
                    onDelete={(id) => setDeleteId(id)} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden divide-y divide-white/[0.04]"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Table header */}
              <div className="flex items-center gap-4 px-4 py-2.5 bg-white/[0.02]"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Client", "Company", "Projects", "Revenue", ""].map((h, i) => (
                  <span key={i} className="text-[10px] font-bold tracking-widest uppercase text-slate-500"
                    style={{
                      flex: h === "Client" ? 1 : "none",
                      width: h === "Company" ? 128 : h === "Projects" ? 80 : h === "Revenue" ? 96 : h === "" ? 64 : undefined,
                    }}>
                    {h}
                  </span>
                ))}
              </div>
              <AnimatePresence>
                {clients.map((c, i) => (
                  <ClientRow key={c._id} client={c} index={i}
                    onEdit={(cl) => setModal(cl)}
                    onDelete={(id) => setDeleteId(id)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </GCard>
      </div>

      {/* ── MODALS ── */}
      <ClientModal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?._id ? "Edit Client" : "New Client"}
      >
        <ClientForm
          initial={modal?._id ? modal : {}}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
          loading={saving}
        />
      </ClientModal>

      <ConfirmDelete
        open={!!deleteId}
        onConfirm={async () => { await deleteClient(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Clients;
