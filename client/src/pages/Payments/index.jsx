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
import { formatDate, formatCurrency } from "../../utils/helpers";
import useDebounce from "../../hooks/useDebounce";

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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25`, boxShadow: s.glow || "none" }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
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

// ── Metric Card ───────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    whileHover={{ y: -2 }}
    className="relative rounded-2xl p-5 overflow-hidden group"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
      style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
      <Icon size={18} style={{ color }} strokeWidth={1.8} />
    </div>
    <p className="text-2xl font-bold tracking-tight text-white mb-0.5">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </motion.div>
);

// ── Empty State ───────────────────────────────────────────
const EmptyInvoices = ({ onNew }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
      <FileText size={28} className="text-indigo-400" />
    </div>
    <h3 className="text-lg font-bold text-white mb-1">No invoices found</h3>
    <p className="text-xs text-gray-400 max-w-xs mb-5">
      Create your first invoice to start getting paid and tracking revenue.
    </p>
    <button onClick={onNew}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
      style={{ background: "linear-gradient(135deg,#635BFF 0%,#8B5CF6 100%)" }}>
      <Plus size={14} /> Create Invoice
    </button>
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments & Invoices</h1>
          <p className="text-xs text-gray-400 mt-1">Manage billing, track payments, and generate invoices.</p>
        </div>

        <button
          onClick={() => navigate("/payments/new")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer shrink-0"
          style={{
            background: "linear-gradient(135deg, #635BFF 0%, #00D4FF 100%)",
            boxShadow: "0 0 20px rgba(99,91,255,0.35)",
          }}
        >
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="Total Received" value={formatCurrency(totalPaid)} color="#22C55E" delay={0.05} />
        <MetricCard icon={Clock} label="Pending Payments" value={pendingCount} color="#635BFF" delay={0.1} />
        <MetricCard icon={AlertCircle} label="Overdue Invoices" value={overdueCount} color="#EF4444" delay={0.15} />
        <MetricCard icon={FileText} label="Total Invoices" value={pagination.total || invoices.length} color="#00D4FF" delay={0.2} />
      </div>

      {/* Controls: Search + Status Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/[0.02] p-2.5 rounded-2xl border border-white/[0.06]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: "none" }}>
          {["all", "draft", "sent", "viewed", "paid", "overdue"].map((status) => (
            <button
              key={status}
              onClick={() => handleTabChange(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                activeTab === status
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <RefreshCw size={24} className="animate-spin text-indigo-400" />
            <p className="text-xs">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <EmptyInvoices onNew={() => navigate("/payments/new")} />
        ) : (
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
        )}
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
