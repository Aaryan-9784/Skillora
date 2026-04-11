import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Search, Mail, Building2,
  Phone, Trash2, Pencil, LayoutGrid, List,
  ExternalLink, FolderKanban, DollarSign,
} from "lucide-react";
import useClientStore from "../../store/clientStore";
import useDebounce from "../../hooks/useDebounce";
import { getInitials, formatCurrency } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// SHARED INPUT STYLES
// ─────────────────────────────────────────────────────────
const iStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F9FAFB",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
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
// EMPTY STATE
// ─────────────────────────────────────────────────────────
const EmptyState = ({ hasSearch, onAdd }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center py-24 text-center relative"
  >
    {/* Radial glow */}
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.07) 0%, transparent 70%)" }} />
    </div>

    {/* Floating icon */}
    <div className="relative mb-8">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(99,91,255,0.15) 0%, rgba(139,92,246,0.08) 100%)",
          border: "1px solid rgba(99,91,255,0.25)",
          boxShadow: "0 0 48px rgba(99,91,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <Users size={40} style={{ color: "#635BFF" }} strokeWidth={1.4} />
      </motion.div>
      {/* Orbiting dots */}
      {[
        { color: "#635BFF", top: "-4px", left: "50%", tx: "-50%" },
        { color: "#00D4FF", top: "50%",  left: "-4px", ty: "-50%" },
        { color: "#22C55E", bottom: "-4px", left: "50%", tx: "-50%" },
      ].map((d, i) => (
        <motion.div key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: d.color, boxShadow: `0 0 8px ${d.color}`, ...d }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>

    {hasSearch ? (
      <>
        <h3 className="text-xl font-bold mb-2" style={{ color: "#F9FAFB" }}>No clients found</h3>
        <p className="text-sm max-w-xs" style={{ color: "#6B7280" }}>
          Try a different search term to find your clients.
        </p>
      </>
    ) : (
      <>
        <h3 className="text-2xl font-bold mb-3"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
          No clients yet
        </h3>
        <p className="text-sm max-w-sm leading-relaxed mb-8" style={{ color: "#6B7280" }}>
          Add your first client to manage projects, invoices, and relationships
          all in one place.
        </p>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(99,91,255,0.5)" }}
          whileTap={{ scale: 0.96 }}
          onClick={onAdd}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
            boxShadow: "0 0 20px rgba(99,91,255,0.35)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add your first client
        </motion.button>
        <p className="mt-5 text-xs flex items-center gap-1.5" style={{ color: "#374151" }}>
          <Users size={10} style={{ color: "#635BFF" }} />
          Tip: Clients help you organize your freelance workflow
        </p>
      </>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// CLIENT CARD (grid view)
// ─────────────────────────────────────────────────────────
const ClientCard = ({ client, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96 }}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="relative rounded-2xl p-5 flex flex-col gap-4 group"
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(12px)",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.border = "1px solid rgba(99,91,255,0.3)";
      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,91,255,0.15)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {/* Hover glow */}
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: "radial-gradient(circle, rgba(99,91,255,0.1) 0%, transparent 70%)" }} />

    {/* Header row */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{
            background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
            boxShadow: "0 0 14px rgba(99,91,255,0.4)",
          }}>
          {getInitials(client.name)}
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{ background: "#22C55E", borderColor: "#0A1120", boxShadow: "0 0 6px rgba(34,197,94,0.7)" }} />
        </div>
        <div className="min-w-0">
          <Link to={`/clients/${client._id}`}
            className="text-sm font-semibold block truncate transition-colors duration-150"
            style={{ color: "#F9FAFB" }}
            onMouseEnter={e => e.target.style.color = "#A78BFA"}
            onMouseLeave={e => e.target.style.color = "#F9FAFB"}>
            {client.name}
          </Link>
          {client.company && (
            <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: "#6B7280" }}>
              <Building2 size={10} />{client.company}
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button onClick={() => onEdit(client)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.15)"; e.currentTarget.style.color = "#A78BFA"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
          <Pencil size={11} />
        </button>
        <button onClick={() => onDelete(client._id)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>

    {/* Contact info */}
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
        <Mail size={11} className="shrink-0" style={{ color: "#4B5563" }} />
        <span className="truncate">{client.email}</span>
      </div>
      {client.phone && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
          <Phone size={11} className="shrink-0" style={{ color: "#4B5563" }} />
          <span>{client.phone}</span>
        </div>
      )}
    </div>

    {/* Stats row */}
    <div className="flex items-center justify-between pt-3"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {[
        { label: "Projects",  value: client.stats?.totalProjects ?? 0,              icon: FolderKanban, color: "#635BFF" },
        { label: "Invoiced",  value: formatCurrency(client.stats?.totalInvoiced ?? 0), icon: DollarSign,   color: "#F59E0B" },
        { label: "Paid",      value: formatCurrency(client.stats?.totalPaid ?? 0),    icon: DollarSign,   color: "#22C55E" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="text-center">
          <p className="text-sm font-bold" style={{ color: "#E5E7EB" }}>{value}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#4B5563" }}>{label}</p>
        </div>
      ))}
    </div>

    {/* View link */}
    <Link to={`/clients/${client._id}`}
      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <ExternalLink size={12} style={{ color: "#635BFF" }} />
    </Link>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// CLIENT ROW (list view)
// ─────────────────────────────────────────────────────────
const ClientRow = ({ client, index, onEdit, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0 }}
    transition={{ delay: index * 0.04 }}
    className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-150 group"
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    {/* Avatar */}
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 10px rgba(99,91,255,0.35)" }}>
      {getInitials(client.name)}
    </div>

    {/* Name + email */}
    <div className="flex-1 min-w-0">
      <Link to={`/clients/${client._id}`}
        className="text-sm font-semibold truncate block transition-colors duration-150"
        style={{ color: "#E5E7EB" }}
        onMouseEnter={e => e.target.style.color = "#A78BFA"}
        onMouseLeave={e => e.target.style.color = "#E5E7EB"}>
        {client.name}
      </Link>
      <p className="text-xs truncate" style={{ color: "#4B5563" }}>{client.email}</p>
    </div>

    {/* Company */}
    <p className="text-xs hidden md:block w-32 truncate" style={{ color: "#6B7280" }}>
      {client.company || "—"}
    </p>

    {/* Projects */}
    <div className="hidden lg:flex items-center gap-1.5 text-xs w-20" style={{ color: "#6B7280" }}>
      <FolderKanban size={11} />{client.stats?.totalProjects ?? 0}
    </div>

    {/* Revenue */}
    <p className="text-xs hidden lg:block w-24 text-right" style={{ color: "#22C55E" }}>
      {formatCurrency(client.stats?.totalPaid ?? 0)}
    </p>

    {/* Actions */}
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
      <button onClick={() => onEdit(client)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100"
        style={{ color: "#6B7280" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.15)"; e.currentTarget.style.color = "#A78BFA"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
        <Pencil size={13} />
      </button>
      <button onClick={() => onDelete(client._id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100"
        style={{ color: "#6B7280" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
        <Trash2 size={13} />
      </button>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// CLIENT FORM
// ─────────────────────────────────────────────────────────
const ClientForm = ({ initial = {}, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "", address: "", notes: "", ...initial,
  });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={lStyle}>Full name *</label>
          <input name="name" placeholder="Jane Doe" value={form.name} onChange={set}
            required style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
        <div>
          <label style={lStyle}>Email *</label>
          <input name="email" type="email" placeholder="jane@acme.com" value={form.email} onChange={set}
            required style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={lStyle}>Company</label>
          <input name="company" placeholder="Acme Corp" value={form.company} onChange={set}
            style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
        <div>
          <label style={lStyle}>Phone</label>
          <input name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={set}
            style={iStyle} onFocus={iFocus} onBlur={iBlur} />
        </div>
      </div>
      <div>
        <label style={lStyle}>Address</label>
        <input name="address" placeholder="123 Main St, City" value={form.address} onChange={set}
          style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <label style={lStyle}>Notes</label>
        <textarea name="notes" placeholder="Any notes about this client…" value={form.notes} onChange={set}
          rows={3} style={{ ...iStyle, resize: "none" }} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
          Cancel
        </button>
        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{
            background: loading ? "rgba(99,91,255,0.5)" : "linear-gradient(135deg,#635BFF,#8B5CF6)",
            boxShadow: loading ? "none" : "0 0 16px rgba(99,91,255,0.35)",
          }}>
          {loading ? "Saving…" : initial._id ? "Save changes" : "Add client"}
        </motion.button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────
const ClientModal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ background: "rgba(4,8,18,0.8)", backdropFilter: "blur(10px)" }}
          onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10"
          style={{
            background: "linear-gradient(160deg,rgba(13,20,40,0.99) 0%,rgba(8,14,28,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 0 0 1px rgba(99,91,255,0.15), 0 32px 64px rgba(0,0,0,0.7)",
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.4),transparent)" }} />
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>{title}</h2>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
              style={{ color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#E5E7EB"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
              ✕
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────
const ConfirmDelete = ({ open, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ background: "rgba(4,8,18,0.8)", backdropFilter: "blur(10px)" }}
          onClick={onCancel} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-sm rounded-2xl p-6 z-10"
          style={{
            background: "rgba(13,20,40,0.99)",
            border: "1px solid rgba(239,68,68,0.2)",
            boxShadow: "0 0 0 1px rgba(239,68,68,0.1), 0 24px 48px rgba(0,0,0,0.6)",
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(239,68,68,0.12)" }}>
            <Trash2 size={18} style={{ color: "#EF4444" }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "#F9FAFB" }}>Delete client</h3>
          <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
            This will permanently delete the client. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}>
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", boxShadow: "0 0 12px rgba(239,68,68,0.3)" }}>
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
const Clients = () => {
  const { clients, fetchClients, createClient, updateClient, deleteClient, isLoading } = useClientStore();
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [view, setView]           = useState("grid");
  const [searchFocused, setSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => { fetchClients({ search: debouncedSearch }); }, [debouncedSearch]);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (modal?._id) await updateClient(modal._id, form);
      else await createClient(form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const hasSearch = !!search;

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 25% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 75% 100%, rgba(0,212,255,0.04) 0%, transparent 55%)",
      }}>
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Clients
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              {isLoading ? "Loading…" : clients.length === 0 ? "No clients yet" : `${clients.length} client${clients.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={15} strokeWidth={2.5} />
            Add Client
          </motion.button>
        </motion.div>

        {/* ── SEARCH + VIEW TOGGLE ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: searchFocused ? "#635BFF" : "#4B5563" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search clients…"
              className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: searchFocused ? "1px solid rgba(99,91,255,0.45)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: searchFocused ? "0 0 0 3px rgba(99,91,255,0.12)" : "none",
                color: "#F9FAFB",
              }}
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl ml-auto"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {[["grid", LayoutGrid], ["list", List]].map(([v, Icon]) => (
              <motion.button key={v} onClick={() => setView(v)} whileTap={{ scale: 0.92 }}
                className="w-8 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: view === v ? "rgba(99,91,255,0.2)" : "transparent",
                  color: view === v ? "#A78BFA" : "#4B5563",
                  border: view === v ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                }}>
                <Icon size={14} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── CONTENT ── */}
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
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Table header */}
            <div className="flex items-center gap-4 px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["Client", "Company", "Projects", "Revenue", ""].map((h, i) => (
                <span key={i} className="text-[10px] font-bold tracking-widest uppercase"
                  style={{
                    color: "#374151",
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
