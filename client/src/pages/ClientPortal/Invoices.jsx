import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Filter, ChevronLeft, ChevronRight,
  Eye, AlertCircle, X, DollarSign, CheckCircle2,
  Clock, TrendingUp, RefreshCw, Calendar, CreditCard, Download,
} from "lucide-react";
import useClientPortalStore from "../../store/clientPortalStore";
import * as svc from "../../services/clientPortalService";
import Modal from "../../components/ui/Modal";
import { SkeletonRow } from "../../components/ui/Skeleton";
import SubpageStatCard from "../../components/dashboard/SubpageStatCard";
import { formatCurrency, formatDate } from "../../utils/helpers";

const PAGE_SIZE = 10;

// ── Status Style Tokens ───────────────────────────────────────────────────
const STATUS_STYLE = {
  draft:     { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", dot: "#9CA3AF" },
  sent:      { bg: "rgba(59,130,246,0.15)",  color: "#60A5FA", dot: "#60A5FA" },
  viewed:    { bg: "rgba(99,91,255,0.15)",   color: "#A78BFA", dot: "#A78BFA" },
  paid:      { bg: "rgba(34,197,94,0.15)",   color: "#4ADE80", dot: "#4ADE80" },
  overdue:   { bg: "rgba(239,68,68,0.15)",   color: "#F87171", dot: "#EF4444" },
  cancelled: { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", dot: "#9CA3AF" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

// ── Glass Container Card (Matches Admin Theme) ─────────────────────────────
const GCard = ({ children, delay, className, glow }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16,1,0.3,1] }}
    className={"relative overflow-hidden rounded-2xl " + (className || "")}
    style={{
      background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: glow ? ("0 0 50px " + glow + "10") : "0 0 30px rgba(99,91,255,0.04)",
    }}
  >
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{ background: glow
        ? ("linear-gradient(90deg,transparent," + glow + "50,transparent)")
        : "linear-gradient(90deg,transparent,rgba(99,91,255,0.25),transparent)" }} />
    {children}
  </motion.div>
);



// ── Financial Summary Bar ──────────────────────────────────────────────────
const FinancialBar = ({ invoices }) => {
  const paid     = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0);
  const pending  = invoices.filter((i) => ["sent","viewed"].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
  const overdue  = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SubpageStatCard icon={CheckCircle2} label="Total Revenue Paid" value={`₹${paid.toLocaleString()}`} color="green" delay={0} sub={`${invoices.filter(i=>i.status==='paid').length} paid invoice(s)`} />
      <SubpageStatCard icon={Clock}        label="Pending Amount"    value={`₹${pending.toLocaleString()}`} color="blue" delay={0.05} sub={`${invoices.filter(i=>['sent','viewed'].includes(i.status)).length} pending invoice(s)`} />
      <SubpageStatCard icon={AlertCircle}  label="Overdue Amount"    value={`₹${overdue.toLocaleString()}`} color="red" delay={0.1} sub={`${invoices.filter(i=>i.status==='overdue').length} overdue invoice(s)`} />
      <SubpageStatCard icon={FileText}     label="Total Invoices"    value={invoices.length}               color="purple" delay={0.15} sub="All time records" />
    </div>
  );
};

// ── Invoice Detail Modal ───────────────────────────────────────────────────
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
        <p className="text-center py-8 text-xs font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>Invoice details not found.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-black text-white">{invoice.invoiceNumber}</p>
              <p className="text-xs font-medium mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>
                Issued {formatDate(invoice.createdAt)} · Due {formatDate(invoice.dueDate)}
              </p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          {/* Freelancer info */}
          {invoice.owner && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.18)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#635BFF,#A78BFA)", boxShadow: "0 0 12px rgba(99,91,255,0.3)" }}>
                {invoice.owner.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{invoice.owner.name}</p>
                <p className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>{invoice.owner.email}</p>
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Description","Qty","Rate","Amount"].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider ${i > 0 ? "text-right" : "text-left"}`}
                      style={{ color: "rgba(148,163,184,0.6)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(invoice.items || invoice.lineItems || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3 font-semibold text-white">{item.description}</td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-2">
            {invoice.tax > 0 && (
              <div className="flex justify-between text-xs font-medium">
                <span style={{ color: "rgba(148,163,184,0.6)" }}>Tax ({invoice.taxRate ?? 0}%)</span>
                <span className="text-white font-bold">{formatCurrency(invoice.tax || invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-xs font-medium">
                <span style={{ color: "rgba(148,163,184,0.6)" }}>Discount</span>
                <span style={{ color: "#4ADE80" }} className="font-bold">-{formatCurrency(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-white">Total</span>
              <span style={{ color: "#A78BFA" }}>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(148,163,184,0.5)" }}>Notes</p>
              <p className="text-xs font-medium" style={{ color: "rgba(209,213,219,0.9)" }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
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

  const handleExportCSV = () => {
    const list = filtered.length ? filtered : invoices;
    const rows = [
      ["Invoice Number", "Total Amount", "Currency", "Due Date", "Status", "Issue Date"],
      ...list.map((inv) => [
        `"${inv.invoiceNumber || ""}"`,
        inv.total || 0,
        `"${inv.currency || "INR"}"`,
        `"${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ""}"`,
        `"${inv.status || ""}"`,
        `"${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : ""}"`,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.2))",
              }}>
              Invoices
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Review invoice status, totals, and billing history
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
              <RefreshCw size={15} className={loading.invoices ? "animate-spin text-indigo-400" : ""} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.3)" }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </motion.button>
          </div>
        </motion.div>

      {/* Financial Summary KPIs */}
      <FinancialBar invoices={invoices} />

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice number or total..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F9FAFB",
            }}
            onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"; e.currentTarget.style.background = "rgba(99,91,255,0.06)"; }}
            onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} style={{ color: "rgba(148,163,184,0.5)", marginRight: 2 }} />
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 cursor-pointer"
              style={{
                background: statusFilter === s ? "linear-gradient(135deg,rgba(99,91,255,0.25) 0%,rgba(139,92,246,0.15) 100%)" : "rgba(255,255,255,0.04)",
                color: statusFilter === s ? "#EDE9FE" : "rgba(148,163,184,0.7)",
                border: statusFilter === s ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: statusFilter === s ? "0 0 12px rgba(99,91,255,0.18)" : "none",
              }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Invoices Table Container */}
      <GCard delay={0.2} glow="#635BFF" className="p-0">
        {loading.invoices && invoices.length === 0 ? (
          <div className="p-6 space-y-2">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : error.invoices && invoices.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
              <AlertCircle size={24} style={{ color: "#EF4444" }} />
            </div>
            <p className="text-xs font-bold text-white">Failed to load invoices</p>
            <button onClick={fetchInvoices} className="text-xs font-bold px-4 py-2 rounded-xl"
              style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
              Retry
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <FileText size={26} style={{ color: "rgba(148,163,184,0.4)" }} />
            </div>
            <p className="text-sm font-bold text-white">
              {filtered.length === 0 && invoices.length > 0 ? "No invoices match your active filters" : "No invoices yet"}
            </p>
            <p className="text-xs font-medium max-w-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
              {invoices.length > 0 ? "Try adjusting your search term or status filter." : "Invoices generated by your project team will automatically appear here."}
            </p>
            {(search || statusFilter !== "all") && (
              <button onClick={() => { setSearch(""); setStatus("all"); }}
                className="text-xs font-bold px-4 py-2 rounded-xl mt-1 cursor-pointer"
                style={{ background: "rgba(99,91,255,0.18)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {["INVOICE NUMBER","TOTAL AMOUNT","DUE DATE","STATUS","ACTION"].map((h, idx) => (
                <span key={h} className={`text-[10px] font-bold tracking-wider uppercase ${idx === 4 ? "text-right" : ""}`} style={{ color: "rgba(148,163,184,0.55)" }}>{h}</span>
              ))}
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/[0.04]">
              <AnimatePresence mode="popLayout">
                {paginated.map((inv, i) => (
                  <motion.div key={inv._id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors duration-150 group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{inv.invoiceNumber}</p>
                      <p className="text-[11px] sm:hidden mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>
                        {inv.currency} {inv.total?.toLocaleString()} · Due {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <p className="hidden sm:block text-xs font-black text-white">
                      {inv.currency} {inv.total?.toLocaleString()}
                    </p>
                    <p className="hidden sm:block text-xs font-semibold" style={{ color: "rgba(148,163,184,0.7)" }}>
                      {formatDate(inv.dueDate)}
                    </p>
                    <StatusBadge status={inv.status} />
                    <div className="text-right">
                      <button onClick={() => setSelected(inv._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer"
                        style={{ background: "rgba(99,91,255,0.12)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.22)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.25)"; e.currentTarget.style.borderColor = "rgba(99,91,255,0.4)"; e.currentTarget.style.color = "#EDE9FE"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.borderColor = "rgba(99,91,255,0.22)"; e.currentTarget.style.color = "#A78BFA"; }}>
                        <Eye size={12} /> <span>View</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </GCard>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>
            Showing <span className="text-white font-bold">{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)}</span> of <span className="text-white font-bold">{filtered.length}</span> invoices
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.8)" }}>
              <ChevronLeft size={14} />
            </button>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => (
              <button key={i} onClick={() => setPage(i+1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                style={{
                  background: page === i+1 ? "linear-gradient(135deg,rgba(99,91,255,0.3) 0%,rgba(139,92,246,0.2) 100%)" : "rgba(255,255,255,0.04)",
                  color: page === i+1 ? "#EDE9FE" : "rgba(148,163,184,0.8)",
                  border: page === i+1 ? "1px solid rgba(99,91,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                }}>{i+1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.8)" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <InvoiceDetailModal invoiceId={selectedId} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
};

export default ClientInvoices;
