import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, TrendingUp, Clock, CheckCircle, FileText,
  AlertCircle, Send, Eye, Trash2, Search, Copy,
  X, RefreshCw,
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
  draft:     { color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", label: "Draft"     },
  sent:      { color: "#635BFF", bg: "rgba(99,91,255,0.12)",   label: "Sent"      },
  viewed:    { color: "#00D4FF", bg: "rgba(0,212,255,0.12)",   label: "Viewed"    },
  paid:      { color: "#22C55E", bg: "rgba(34,197,94,0.12)",   label: "Paid", glow: "0 0 10px rgba(34,197,94,0.4)" },
  overdue:   { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   label: "Overdue", glow: "0 0 10px rgba(239,68,68,0.4)" },
  cancelled: { color: "#6B7280", bg: "rgba(107,114,128,0.12)", label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide shrink-0"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25`, boxShadow: s.glow || "none" }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
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
      className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-150 group relative cursor-pointer"
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
        <FileText size={14} style={{ color: "#635BFF" }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-white">{inv.invoiceNumber}</p>
        <p className="text-xs truncate text-gray-400 mt-0.5">
          {inv.clientId?.name || "Client"}{inv.projectId?.title ? ` · ${inv.projectId.title}` : ""} · Due {formatDate(inv.dueDate)}
        </p>
      </div>

      <StatusBadge status={inv.status} />

      <p className="text-sm font-bold hidden sm:block shrink-0 text-white">
        {formatCurrency(inv.total, inv.currency)}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
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
        </motion.div>

        {/* ── KPI STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SubpageStatCard icon={TrendingUp} label="Total Received" value={formatCurrency(totalPaid, "INR")} color="green" delay={0.05} />
          <SubpageStatCard icon={Clock} label="Pending Payments" value={pendingCount} color="brand" delay={0.1} />
          <SubpageStatCard icon={AlertCircle} label="Overdue Invoices" value={overdueCount} color="red" delay={0.15} />
          <SubpageStatCard icon={FileText} label="Total Invoices" value={pagination.total || invoices.length} color="cyan" delay={0.2} />
        </div>

        {/* ── CONTROLS TOOLBAR (Search + Status Tabs) ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl"
          style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.65) 0%, rgba(10,15,26,0.85) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)"
          }}>
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: "none" }}>
            {["all", "draft", "sent", "viewed", "paid", "overdue"].map((status) => (
              <button
                key={status}
                onClick={() => handleTabChange(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 cursor-pointer ${
                  activeTab === status
                    ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-purple-300 border border-indigo-500/35 shadow-md shadow-indigo-500/10"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number..."
              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
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
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN INVOICES CARD CONTAINER (Client Portal GCard) ── */}
        <GCard delay={0.2} glow="#635BFF" className="min-h-[320px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
              <p className="text-xs font-semibold">Loading invoice matrix...</p>
            </div>
          ) : invoices.length === 0 ? (
            <EmptyInvoices onNew={() => navigate("/payments/new")} />
          ) : (
            <div className="divide-y divide-white/[0.04] p-2">
              {invoices.map((inv, idx) => (
                <InvoiceRow
                  key={inv._id}
                  inv={inv}
                  index={idx}
                  onDelete={(i) => setDeleteModal(i)}
                />
              ))}
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
