import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, TrendingUp, Clock, CheckCircle, FileText,
  AlertCircle, ArrowRight, ExternalLink, MoreHorizontal,
  Send, Eye, Trash2, Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useInvoiceStore from "../../store/invoiceStore";
import { formatDate, formatCurrency } from "../../utils/helpers";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_STYLE = {
  draft:     { color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", label: "Draft"     },
  sent:      { color: "#635BFF", bg: "rgba(99,91,255,0.12)",   label: "Sent"      },
  viewed:    { color: "#00D4FF", bg: "rgba(0,212,255,0.12)",   label: "Viewed"    },
  paid:      { color: "#22C55E", bg: "rgba(34,197,94,0.12)",   label: "Paid",     glow: "0 0 10px rgba(34,197,94,0.4)"  },
  overdue:   { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   label: "Overdue",  glow: "0 0 10px rgba(239,68,68,0.4)"  },
  cancelled: { color: "#6B7280", bg: "rgba(107,114,128,0.12)", label: "Cancelled" },
};

// ─────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}25`,
        boxShadow: s.glow || "none",
      }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, trend, trendLabel, color, glow, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="relative rounded-2xl p-5 overflow-hidden group"
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(12px)",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.border = `1px solid ${color}35`;
      e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}18`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {/* Ambient glow */}
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />

    {/* Top gradient line on hover */}
    <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

    {/* Icon */}
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
      style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
      <Icon size={18} style={{ color }} strokeWidth={1.8} />
    </div>

    {/* Value */}
    <p className="text-2xl font-bold tracking-tight mb-0.5" style={{ color: "#F9FAFB" }}>{value}</p>
    <p className="text-sm" style={{ color: "#9CA3AF" }}>{label}</p>

    {/* Trend */}
    {trend !== undefined && (
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs font-semibold" style={{ color: trend >= 0 ? "#22C55E" : "#EF4444" }}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
        {trendLabel && <span className="text-[10px]" style={{ color: "#4B5563" }}>{trendLabel}</span>}
      </div>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────
const SkeletonMetric = () => (
  <div className="rounded-2xl p-5 animate-pulse"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
    <div className="w-10 h-10 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.07)" }} />
    <div className="h-7 w-24 rounded mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
    <div className="h-3.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3.5 px-4 animate-pulse">
    <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 w-1/3 rounded" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="h-3 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
    <div className="h-6 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
    <div className="h-4 w-20 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
  </div>
);

// ─────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────
const EmptyInvoices = ({ onNew }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center relative"
  >
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.06) 0%, transparent 70%)" }} />
    </div>

    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(99,91,255,0.15) 0%, rgba(139,92,246,0.08) 100%)",
        border: "1px solid rgba(99,91,255,0.25)",
        boxShadow: "0 0 40px rgba(99,91,255,0.12)",
      }}
    >
      <FileText size={34} style={{ color: "#635BFF" }} strokeWidth={1.4} />
    </motion.div>

    <h3 className="text-xl font-bold mb-2"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
      No invoices yet
    </h3>
    <p className="text-sm max-w-xs leading-relaxed mb-7" style={{ color: "#6B7280" }}>
      Create your first invoice to start getting paid and tracking your revenue.
    </p>

    <motion.button
      whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.5)" }}
      whileTap={{ scale: 0.96 }}
      onClick={onNew}
      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
      style={{
        background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
        boxShadow: "0 0 18px rgba(99,91,255,0.35)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <Plus size={15} strokeWidth={2.5} />
      Create Invoice
    </motion.button>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// CUSTOM CHART TOOLTIP
// ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-sm"
      style={{
        background: "rgba(10,17,32,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}>
      <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
      <p className="font-bold" style={{ color: "#F9FAFB" }}>{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// ANALYTICS TAB
// ─────────────────────────────────────────────────────────
const AnalyticsTab = ({ chartData, totalRevenue, invoices }) => {
  const PIE_DATA = [
    { name: "Paid",      value: invoices.filter(i => i.status === "paid").length,      color: "#22C55E" },
    { name: "Pending",   value: invoices.filter(i => i.status === "sent").length,      color: "#635BFF" },
    { name: "Overdue",   value: invoices.filter(i => i.status === "overdue").length,   color: "#EF4444" },
    { name: "Draft",     value: invoices.filter(i => i.status === "draft").length,     color: "#6B7280" },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Revenue chart */}
      <div className="lg:col-span-2 rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>Revenue over time</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Monthly paid invoices</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "#F9FAFB" }}>{formatCurrency(totalRevenue)}</p>
            <p className="text-xs flex items-center justify-end gap-1 mt-0.5" style={{ color: "#22C55E" }}>
              ↑ 18% <span style={{ color: "#4B5563" }}>vs last period</span>
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-xl"
            style={{ border: "2px dashed rgba(255,255,255,0.06)" }}>
            <p className="text-sm" style={{ color: "#374151" }}>No revenue data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#635BFF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#635BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />}
                cursor={{ stroke: "#635BFF", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 }} />
              <Area type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2}
                fill="url(#revGrad)" dot={false}
                activeDot={{ r: 4, fill: "#635BFF", strokeWidth: 0, filter: "drop-shadow(0 0 6px #635BFF)" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Invoice status breakdown */}
      <div className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h3 className="text-base font-semibold mb-1" style={{ color: "#F9FAFB" }}>Invoice Status</h3>
        <p className="text-xs mb-5" style={{ color: "#6B7280" }}>Breakdown by status</p>

        {PIE_DATA.length === 0 ? (
          <div className="flex items-center justify-center h-40 rounded-xl"
            style={{ border: "2px dashed rgba(255,255,255,0.06)" }}>
            <p className="text-sm" style={{ color: "#374151" }}>No data yet</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value">
                  {PIE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color}
                      style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,17,32,0.97)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#F9FAFB",
                  }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-2">
              {PIE_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{d.name}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#E5E7EB" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// INVOICE ROW
// ─────────────────────────────────────────────────────────
const InvoiceRow = ({ inv, index }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { sendInvoice, updateStatus } = useInvoiceStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => navigate(`/payments/${inv._id}`)}
      className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-150 group relative cursor-pointer"
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
        <FileText size={14} style={{ color: "#635BFF" }} />
      </div>

      {/* Invoice # + client */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#E5E7EB" }}>
          {inv.invoiceNumber}
        </p>
        <p className="text-xs truncate" style={{ color: "#4B5563" }}>
          {inv.clientId?.name || "—"} · Due {formatDate(inv.dueDate)}
        </p>
      </div>

      {/* Status */}
      <StatusBadge status={inv.status} />

      {/* Amount */}
      <p className="text-sm font-bold hidden sm:block shrink-0" style={{ color: "#F9FAFB" }}>
        {formatCurrency(inv.total, inv.currency)}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/payments/${inv._id}`); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.15)"; e.currentTarget.style.color = "#A78BFA"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
          title="View">
          <Eye size={13} />
        </button>
        {inv.status === "draft" && (
          <button
            onClick={(e) => { e.stopPropagation(); sendInvoice(inv._id); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.15)"; e.currentTarget.style.color = "#22C55E"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
            title="Send">
            <Send size={13} />
          </button>
        )}
        {["sent", "viewed", "overdue"].includes(inv.status) && (
          <button
            onClick={(e) => { e.stopPropagation(); updateStatus(inv._id, "paid"); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.15)"; e.currentTarget.style.color = "#22C55E"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
            title="Mark paid">
            <CheckCircle size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
const Payments = () => {
  const { invoices, analytics, outstanding, fetchInvoices, fetchAnalytics, isLoading } = useInvoiceStore();
  const [tab, setTab] = useState("invoices");
  const [filters, setFilters] = useState({ status: "", search: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
    fetchAnalytics();
  }, []);

  const filtered = invoices.filter((inv) => {
    const matchStatus = !filters.status || inv.status === filters.status;
    const matchSearch = !filters.search ||
      inv.invoiceNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
      inv.clientId?.name?.toLowerCase().includes(filters.search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const chartData = (analytics || []).map((d) => ({
    month: MONTH_NAMES[(d.month || 1) - 1],
    revenue: d.revenue,
  }));
  const totalRevenue = (analytics || []).reduce((s, d) => s + d.revenue, 0);

  const METRICS = [
    {
      icon: TrendingUp, label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      trend: 18, trendLabel: "vs last month",
      color: "#635BFF", glow: "rgba(99,91,255,0.3)", delay: 0,
    },
    {
      icon: Clock, label: "Outstanding",
      value: formatCurrency(outstanding?.outstanding ?? 0),
      color: "#F59E0B", glow: "rgba(245,158,11,0.3)", delay: 0.06,
    },
    {
      icon: CheckCircle, label: "Paid Invoices",
      value: invoices.filter(i => i.status === "paid").length,
      color: "#22C55E", glow: "rgba(34,197,94,0.3)", delay: 0.12,
    },
    {
      icon: AlertCircle, label: "Overdue",
      value: invoices.filter(i => i.status === "overdue").length,
      color: "#EF4444", glow: "rgba(239,68,68,0.3)", delay: 0.18,
    },
  ];

  const TABS = [
    { id: "invoices",  label: "Invoices",  icon: FileText,   count: filtered.length },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(0,212,255,0.04) 0%, transparent 55%)",
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
              Payments
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Track revenue, invoices, and financial performance
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/payments/new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={15} strokeWidth={2.5} />
            New Invoice
          </motion.button>
        </motion.div>

        {/* ── METRIC CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonMetric key={i} />)
            : METRICS.map((m) => <MetricCard key={m.label} {...m} />)
          }
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {TABS.map((t) => (
            <motion.button key={t.id} onClick={() => setTab(t.id)} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: tab === t.id ? "rgba(99,91,255,0.2)" : "transparent",
                color:      tab === t.id ? "#A78BFA" : "#6B7280",
                border:     tab === t.id ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
              }}>
              <t.icon size={14} />
              {t.label}
              {t.count !== undefined && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: tab === t.id ? "rgba(99,91,255,0.25)" : "rgba(255,255,255,0.07)",
                    color: tab === t.id ? "#C4B5FD" : "#4B5563",
                  }}>
                  {t.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">
          {tab === "invoices" && (
            <motion.div key="invoices"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>

                {/* Filter bar */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="relative flex-1 max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4B5563" }} />
                    <input
                      value={filters.search}
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                      placeholder="Search invoices…"
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand/40"
                    />
                  </div>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:border-brand/40"
                  >
                    <option value="">All status</option>
                    {["draft","sent","viewed","paid","overdue","cancelled"].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Table header */}
                {invoices.length > 0 && (
                  <div className="flex items-center gap-4 px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {["Invoice", "Status", "Amount", ""].map((h, i) => (
                      <span key={i} className="text-[10px] font-bold tracking-widest uppercase"
                        style={{
                          color: "#374151",
                          flex: h === "Invoice" ? 1 : "none",
                          width: h === "Status" ? 100 : h === "Amount" ? 96 : h === "" ? 72 : undefined,
                        }}>
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {isLoading ? (
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                  </div>
                ) : invoices.length === 0 ? (
                  <EmptyInvoices onNew={() => navigate("/payments/new")} />
                ) : (
                  <div>
                    {filtered.map((inv, i) => (
                      <InvoiceRow key={inv._id} inv={inv} index={i} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "analytics" && (
            <motion.div key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AnalyticsTab chartData={chartData} totalRevenue={totalRevenue} invoices={invoices} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Payments;
