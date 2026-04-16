import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Filter, ChevronLeft, ChevronRight,
  Eye, AlertCircle, X, DollarSign, CheckCircle2,
  Clock, TrendingUp,
} from "lucide-react";
import useClientPortalStore from "../../store/clientPortalStore";
import * as svc from "../../services/clientPortalService";
import Modal from "../../components/ui/Modal";
import { SkeletonRow } from "../../components/ui/Skeleton";
import { formatCurrency, formatDate } from "../../utils/helpers";

const PAGE_SIZE = 10;

const STATUS_STYLE = {
  draft:     { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF" },
  sent:      { bg: "rgba(59,130,246,0.15)",  color: "#60A5FA" },
  viewed:    { bg: "rgba(99,91,255,0.15)",   color: "#A78BFA" },
  paid:      { bg: "rgba(34,197,94,0.15)",   color: "#4ADE80" },
  overdue:   { bg: "rgba(239,68,68,0.15)",   color: "#F87171" },
  cancelled: { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}>{status}</span>
  );
};

// ── Financial summary bar ─────────────────────────────────
const FinancialBar = ({ invoices }) => {
  const paid     = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0);
  const pending  = invoices.filter((i) => ["sent","viewed"].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
  const overdue  = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.total || 0), 0);
  const total    = paid + pending + overdue;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Total Paid",    value: paid,    color: "#22C55E", icon: CheckCircle2 },
        { label: "Pending",       value: pending, color: "#60A5FA", icon: Clock },
        { label: "Overdue",       value: overdue, color: "#EF4444", icon: AlertCircle },
      ].map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle,${color}12 0%,transparent 70%)`, transform: "translate(30%,-30%)" }} />
          <div className="flex items-center gap-2 mb-2">
            <Icon size={13} style={{ color }} />
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{label}</span>
          </div>
          <p className="text-lg font-bold text-white">₹{value.toLocaleString()}</p>
          {total > 0 && (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(value / total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full" style={{ background: color }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Invoice detail modal ──────────────────────────────────
const InvoiceDetailModal = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    svc.getInvoiceDetail(invoiceId)
      .then((r) => setInvoice(r.data.data.invoice))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoiceId]);

  return (
    <Modal isOpen={!!invoiceId} onClose={onClose} title="Invoice Details" size="lg">
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : !invoice ? (
        <p className="text-center py-8" style={{ color: "#6B7280" }}>Invoice not found.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-white">{invoice.invoiceNumber}</p>
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                Issued {formatDate(invoice.createdAt)} · Due {formatDate(invoice.dueDate)}
              </p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          {/* Freelancer info */}
          {invoice.owner && (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.15)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#635BFF,#A78BFA)" }}>
                {invoice.owner.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{invoice.owner.name}</p>
                <p className="text-[11px]" style={{ color: "#6B7280" }}>{invoice.owner.email}</p>
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Description","Qty","Rate","Amount"].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 text-xs font-semibold ${i > 0 ? "text-right" : "text-left"}`}
                      style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(invoice.items || invoice.lineItems || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3 text-white">{item.description}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "#9CA3AF" }}>{item.quantity}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "#9CA3AF" }}>{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-2">
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "#9CA3AF" }}>Tax ({invoice.taxRate ?? 0}%)</span>
                <span className="text-white">{formatCurrency(invoice.tax || invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "#9CA3AF" }}>Discount</span>
                <span style={{ color: "#4ADE80" }}>-{formatCurrency(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-white">Total</span>
              <span style={{ color: "#A78BFA" }}>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#6B7280" }}>Notes</p>
              <p className="text-sm" style={{ color: "#D1D5DB" }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ── Main component ────────────────────────────────────────
const ClientInvoices = () => {
  const { invoices, loading, error, fetchInvoices, patchInvoice } = useClientPortalStore();
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [page, setPage]           = useState(1);
  const [selectedId, setSelected] = useState(null);

  useEffect(() => {
    fetchInvoices();
    const onInvoice = (e) => patchInvoice(e.detail.invoiceId, { status: e.detail.status });
    window.addEventListener("invoice:updated", onInvoice);
    return () => window.removeEventListener("invoice:updated", onInvoice);
  }, []);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.invoiceNumber?.toLowerCase().includes(q) || i.total?.toString().includes(q));
    }
    return list;
  }, [invoices, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const STATUS_OPTS = ["all","draft","sent","viewed","paid","overdue","cancelled"];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Your Invoices</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Financial summary */}
      {invoices.length > 0 && <FinancialBar invoices={invoices} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6B7280" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F9FAFB" }}
            onFocus={e => e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"}
            onBlur={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#6B7280" }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} style={{ color: "#6B7280" }} />
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150"
              style={{
                background: statusFilter === s ? "rgba(99,91,255,0.2)" : "rgba(255,255,255,0.04)",
                color: statusFilter === s ? "#A78BFA" : "#6B7280",
                border: statusFilter === s ? "1px solid rgba(99,91,255,0.35)" : "1px solid rgba(255,255,255,0.07)",
              }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {loading.invoices && invoices.length === 0 ? (
          <div className="p-4 space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : error.invoices && invoices.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <AlertCircle size={28} style={{ color: "#EF4444" }} />
            <p className="text-sm text-white">Failed to load invoices</p>
            <button onClick={fetchInvoices} className="text-xs px-4 py-2 rounded-lg"
              style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
              Retry
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <FileText size={32} style={{ color: "#374151" }} />
            <p className="text-sm font-medium text-white">
              {filtered.length === 0 && invoices.length > 0 ? "No invoices match your filters" : "No invoices yet"}
            </p>
            {(search || statusFilter !== "all") && (
              <button onClick={() => { setSearch(""); setStatus("all"); }}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(99,91,255,0.15)", color: "#A78BFA" }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {["Invoice #","Amount","Due Date","Status",""].map((h) => (
                <span key={h} className="text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</span>
              ))}
            </div>
            <AnimatePresence mode="popLayout">
              {paginated.map((inv, i) => (
                <motion.div key={inv._id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 px-5 py-4 items-center transition-colors duration-150"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <p className="text-sm font-semibold text-white">{inv.invoiceNumber}</p>
                    <p className="text-xs sm:hidden mt-0.5" style={{ color: "#6B7280" }}>
                      {inv.currency} {inv.total?.toLocaleString()} · Due {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <p className="hidden sm:block text-sm font-semibold text-white">
                    {inv.currency} {inv.total?.toLocaleString()}
                  </p>
                  <p className="hidden sm:block text-sm" style={{ color: "#9CA3AF" }}>
                    {formatDate(inv.dueDate)}
                  </p>
                  <StatusBadge status={inv.status} />
                  <button onClick={() => setSelected(inv._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{ background: "rgba(99,91,255,0.12)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.2)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.22)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(99,91,255,0.12)"}>
                    <Eye size={12} /> View
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.05)", color: "#9CA3AF" }}>
              <ChevronLeft size={14} />
            </button>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => (
              <button key={i} onClick={() => setPage(i+1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  background: page === i+1 ? "rgba(99,91,255,0.25)" : "rgba(255,255,255,0.05)",
                  color: page === i+1 ? "#A78BFA" : "#9CA3AF",
                  border: page === i+1 ? "1px solid rgba(99,91,255,0.4)" : "1px solid transparent",
                }}>{i+1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.05)", color: "#9CA3AF" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <InvoiceDetailModal invoiceId={selectedId} onClose={() => setSelected(null)} />
    </div>
  );
};

export default ClientInvoices;
