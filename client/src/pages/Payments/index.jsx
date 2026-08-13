import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, TrendingUp, Clock, CheckCircle, FileText,
  AlertCircle, Send, Eye, Trash2, Search, Copy,
  X, RefreshCw, Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useInvoiceStore from "../../store/invoiceStore";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { formatDate, formatCurrency } from "../../utils/helpers";
import useDebounce from "../../hooks/useDebounce";

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
  draft:     { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", dot: "#9CA3AF", label: "Draft" },
  sent:      { bg: "rgba(59,130,246,0.15)",  color: "#60A5FA", dot: "#60A5FA", label: "Sent" },
  viewed:    { bg: "rgba(99,91,255,0.15)",   color: "#A78BFA", dot: "#A78BFA", label: "Viewed" },
  paid:      { bg: "rgba(34,197,94,0.15)",   color: "#4ADE80", dot: "#4ADE80", label: "Paid" },
  overdue:   { bg: "rgba(239,68,68,0.15)",   color: "#F87171", dot: "#EF4444", label: "Overdue" },
  cancelled: { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", dot: "#9CA3AF", label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

// ── Action Button ─────────────────────────────────────────
const ActionBtn = ({ icon: Icon, title, color, bg, onClick }) => (
  <button onClick={onClick} title={title}
    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100 cursor-pointer"
    style={{ color: "#6B7280" }}
    onMouseEnter={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
    <Icon size={13} />
  </button>
);

// ── Invoice Row ───────────────────────────────────────────
const InvoiceRow = ({ inv, index, onDelete }) => {
  const navigate = useNavigate();
  const { sendInvoice, updateStatus, duplicateInvoice } = useInvoiceStore();

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => navigate(`/payments/${inv._id}`)}
      className="flex items-center gap-4 py-3.5 px-4 hover:bg-white/[0.03] transition-colors group cursor-pointer border-b border-white/[0.04] last:border-0">

      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
        <FileText size={14} style={{ color: "#635BFF" }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{inv.invoiceNumber}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">
          Due {formatDate(inv.dueDate)}
        </p>
      </div>

      <div className="hidden md:block flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-200 truncate">{inv.clientId?.name || "Client"}</p>
        {inv.projectId?.title && <p className="text-[11px] text-slate-400 truncate">{inv.projectId.title}</p>}
      </div>

      <div className="w-28 shrink-0">
        <StatusBadge status={inv.status} />
      </div>

      <div className="w-28 shrink-0 text-right">
        <p className="text-xs font-black text-white">
          {formatCurrency(inv.total, inv.currency)}
        </p>
      </div>

      {/* Actions */}
      <div className="w-28 shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={e => e.stopPropagation()}>
        <ActionBtn icon={Eye} title="View" color="#A78BFA" bg="rgba(99,91,255,0.15)"
          onClick={() => navigate(`/payments/${inv._id}`)} />
        {inv.status === "draft" && (
          <ActionBtn icon={Send} title="Send" color="#22C55E" bg="rgba(34,197,94,0.15)"
            onClick={() => sendInvoice(inv._id)} />
        )}
        {["sent","viewed","overdue"].includes(inv.status) && (
          <ActionBtn icon={CheckCircle} title="Mark paid" color="#22C55E" bg="rgba(34,197,94,0.15)"
            onClick={() => updateStatus(inv._id, "paid")} />
        )}
        <ActionBtn icon={Copy} title="Duplicate" color="#E5E7EB" bg="rgba(255,255,255,0.08)"
          onClick={() => duplicateInvoice(inv._id)} />
        {inv.status !== "paid" && (
          <ActionBtn icon={Trash2} title="Delete" color="#EF4444" bg="rgba(239,68,68,0.15)"
            onClick={() => onDelete(inv)} />
        )}
      </div>
    </motion.div>
  );
};

// ── Empty State Container ─────────────────────────────────
const EmptyInvoices = ({ onNew }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/10"
      style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)" }}>
      <FileText size={26} className="text-indigo-400" />
    </div>
    <h3 className="text-base font-bold text-white mb-1">No invoices found</h3>
    <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-5">
      Create your first invoice to start getting paid and tracking revenue.
    </p>
    <motion.button
      whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,91,255,0.4)" }}
      whileTap={{ scale: 0.96 }}
      onClick={onNew}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
      style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)", border: "1px solid rgba(255,255,255,0.15)" }}>
      <Plus size={15} strokeWidth={2.5} />
      <span>Create Invoice</span>
    </motion.button>
  </div>
);

// ── MAIN PAYMENTS COMPONENT ───────────────────────────────
const Payments = () => {
  const navigate = useNavigate();
  const {
    invoices, isLoading, pagination, filters, setFilters,
    fetchInvoices, fetchAnalytics, deleteInvoice
  } = useInvoiceStore();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState(filters.search || "");
  const [deleteModal, setDeleteModal] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchInvoices();
    fetchAnalytics();
    const handleSync = () => {
      fetchInvoices();
      fetchAnalytics();
    };
    window.addEventListener("invoice:updated",   handleSync);
    window.addEventListener("dashboard:refresh", handleSync);
    return () => {
      window.removeEventListener("invoice:updated",   handleSync);
      window.removeEventListener("dashboard:refresh", handleSync);
    };
  }, []);

  useEffect(() => {
    setFilters({ search: debouncedSearch, page: 1 });
    fetchInvoices();
  }, [debouncedSearch]);

  const handleTabChange = (status) => {
    setActiveTab(status);
    setFilters({ status: status === "all" ? "" : status, page: 1 });
    fetchInvoices();
  };

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
  const pendingCount = invoices.filter(i => ["sent","viewed"].includes(i.status)).length;
  const overdueCount = invoices.filter(i => i.status === "overdue").length;

  return (
    <div className="min-h-screen relative overflow-hidden pb-12"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.06) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
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
              Payments & Invoices
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Manage client billing, track incoming payments, and issue professional invoices
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchInvoices}
              title="Refresh Data"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.75)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.75)"; }}
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin text-indigo-400" : ""} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/payments/new")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shrink-0"
              style={{
                background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
                boxShadow: "0 0 20px rgba(99,91,255,0.35)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
              <Plus size={15} strokeWidth={2.5} />
              <span>Create Invoice</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SubpageStatCard icon={TrendingUp} label="Total Received" value={formatCurrency(totalPaid, "INR")} color="green" delay={0.05} />
          <SubpageStatCard icon={Clock} label="Pending Payments" value={pendingCount} color="brand" delay={0.1} />
          <SubpageStatCard icon={AlertCircle} label="Overdue Invoices" value={overdueCount} color="red" delay={0.15} />
          <SubpageStatCard icon={FileText} label="Total Invoices" value={pagination.total || invoices.length} color="cyan" delay={0.2} />
        </div>

        {/* ── CONTROLS TOOLBAR (Search + Status Tabs) ── */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar on Left */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number or total..."
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

          {/* Status Filter Tabs on Right */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0" style={{ scrollbarWidth: "none" }}>
            <Filter size={13} style={{ color: "rgba(148,163,184,0.5)", marginRight: 2 }} className="shrink-0" />
            {["all", "draft", "sent", "viewed", "paid", "overdue"].map((status) => (
              <button
                key={status}
                onClick={() => handleTabChange(status)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 shrink-0 cursor-pointer"
                style={{
                  background: activeTab === status ? "linear-gradient(135deg,rgba(99,91,255,0.25) 0%,rgba(139,92,246,0.15) 100%)" : "rgba(255,255,255,0.04)",
                  color: activeTab === status ? "#EDE9FE" : "rgba(148,163,184,0.7)",
                  border: activeTab === status ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: activeTab === status ? "0 0 12px rgba(99,91,255,0.18)" : "none",
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN INVOICES CARD CONTAINER (Client Portal GCard) ── */}
        <GCard delay={0.2} glow="#635BFF" className="min-h-[380px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] text-slate-400 gap-3">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
              <p className="text-xs font-semibold">Loading invoice matrix...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] py-16 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1 shadow-lg shadow-indigo-500/10"
                style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.25)" }}>
                <FileText size={26} style={{ color: "#A78BFA" }} />
              </div>
              <h3 className="text-base font-bold text-white">No invoices found</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Create your first invoice to start getting paid and tracking revenue.
              </p>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(99,91,255,0.4)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/payments/new")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer mt-2"
                style={{ background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 0 20px rgba(99,91,255,0.35)" }}>
                <Plus size={15} strokeWidth={2.5} />
                <span>Create Invoice</span>
              </motion.button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table Header Row */}
              <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02]"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 w-8 text-center shrink-0" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 flex-1 min-w-0">Invoice #</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hidden md:block flex-1 min-w-0">Client / Workspace</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 w-28 shrink-0">Status</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 w-28 shrink-0 text-right">Amount</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 w-28 shrink-0 text-right">Actions</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {invoices.map((inv, idx) => (
                  <InvoiceRow
                    key={inv._id}
                    inv={inv}
                    index={idx}
                    onDelete={(i) => setDeleteModal(i)}
                  />
                ))}
              </div>
            </div>
          )}
        </GCard>

      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <ConfirmDialog
          open={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={async () => {
            await deleteInvoice(deleteModal._id);
            setDeleteModal(null);
            fetchInvoices();
          }}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice ${deleteModal.invoiceNumber}? This action cannot be undone.`}
          confirmText="Delete"
        />
      )}
    </div>
  );
};

export default Payments;
