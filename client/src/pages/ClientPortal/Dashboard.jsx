import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, FolderOpen, DollarSign, CheckCircle2,
  AlertCircle, ArrowRight, TrendingUp, TrendingDown,
  Sparkles, BarChart2, RefreshCw, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import useClientPortalStore from "../../store/clientPortalStore";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { SkeletonStat } from "../../components/ui/Skeleton";

// ── Shared style helpers ──────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_STYLE = {
  draft:     { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", label: "Draft" },
  sent:      { bg: "rgba(59,130,246,0.15)",  color: "#60A5FA", label: "Sent" },
  viewed:    { bg: "rgba(99,91,255,0.15)",   color: "#A78BFA", label: "Viewed" },
  paid:      { bg: "rgba(34,197,94,0.15)",   color: "#4ADE80", label: "Paid" },
  overdue:   { bg: "rgba(239,68,68,0.15)",   color: "#F87171", label: "Overdue" },
  cancelled: { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
};

// ── Stat card ─────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, trend, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    className="relative rounded-2xl p-5 overflow-hidden"
    style={{
      background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
    }}>
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle,${color}12 0%,transparent 70%)`, transform: "translate(30%,-30%)" }} />
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}28`, boxShadow: `0 0 16px ${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: trend >= 0 ? "#4ADE80" : "#F87171" }}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm font-medium" style={{ color: "#9CA3AF" }}>{label}</p>
    {sub && <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{sub}</p>}
  </motion.div>
);

// ── Chart tooltip ─────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-sm"
      style={{ background: "rgba(10,17,32,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
      <p className="text-xs mb-1.5 font-medium" style={{ color: "#9CA3AF" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="font-semibold text-white">₹{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// Earnings chart (real API data)
const EarningsSection = ({ revenueAnalytics, loading }) => {
  const [period, setPeriod] = useState("6m");

  // Guard: revenueAnalytics may be undefined on first render
  const analytics = Array.isArray(revenueAnalytics) ? revenueAnalytics : [];

  const chartData = useMemo(() => {
    const now = new Date();
    const monthsBack = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    const result = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const found = analytics.find(
        (r) => r.year === d.getFullYear() && r.month === d.getMonth() + 1
      );
      result.push({
        label:   MONTHS[d.getMonth()],
        revenue: found?.revenue || 0,
        count:   found?.invoiceCount || 0,
      });
    }
    return result;
  }, [analytics, period]);

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const prevHalf     = chartData.slice(0, Math.floor(chartData.length / 2)).reduce((s, d) => s + d.revenue, 0);
  const currHalf     = chartData.slice(Math.floor(chartData.length / 2)).reduce((s, d) => s + d.revenue, 0);
  const trendPct     = prevHalf > 0 ? Math.round(((currHalf - prevHalf) / prevHalf) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="rounded-2xl p-5 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
            <BarChart2 size={13} style={{ color: "#A78BFA" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Revenue Overview</h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>Paid invoices over time</p>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right">
            <p className="text-xl font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
            <div className="flex items-center justify-end gap-1 text-xs"
              style={{ color: trendPct >= 0 ? "#4ADE80" : "#F87171" }}>
              {trendPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span>{Math.abs(trendPct)}% vs prior period</span>
            </div>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {["3m","6m","1y"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  background: period === p ? "rgba(99,91,255,0.25)" : "transparent",
                  color: period === p ? "#A78BFA" : "#6B7280",
                  border: period === p ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: "#635BFF" }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : (
        <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clientRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#635BFF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#635BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTooltip />}
                cursor={{ stroke: "#635BFF", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 }} />
              <Area type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2}
                fill="url(#clientRevGrad)" dot={false}
                activeDot={{ r: 4, fill: "#635BFF", strokeWidth: 0, filter: "drop-shadow(0 0 6px #635BFF)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  );
};

// ── AI Insights panel ─────────────────────────────────────
const AiInsightsPanel = ({ insights, loading, onRefresh }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: 0.25 }}
    className="rounded-2xl overflow-hidden"
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
    <div className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <Sparkles size={13} style={{ color: "#A78BFA" }} />
        </div>
        <h2 className="text-sm font-semibold text-white">AI Insights</h2>
      </div>
      <button onClick={onRefresh} disabled={loading}
        className="p-1.5 rounded-lg transition-all duration-150 disabled:opacity-40"
        style={{ color: "#6B7280" }}
        onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
        onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}>
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
      </button>
    </div>

    <div className="p-5">
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-4 rounded-lg" style={{ width: `${85 - i * 10}%` }} />
          ))}
        </div>
      ) : !insights ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <Sparkles size={24} style={{ color: "#374151" }} />
          <p className="text-xs text-center" style={{ color: "#6B7280" }}>
            AI insights will appear here once you have activity data.
          </p>
          <button onClick={onRefresh}
            className="text-xs px-3 py-1.5 rounded-lg mt-1"
            style={{ background: "rgba(99,91,255,0.15)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.25)" }}>
            Generate insights
          </button>
        </div>
      ) : (
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#D1D5DB" }}>
          {typeof insights === "string" ? insights : JSON.stringify(insights, null, 2)}
        </div>
      )}
    </div>
  </motion.div>
);

// ── Project progress row ──────────────────────────────────
const ProjectRow = ({ project, delay }) => {
  const pct = project.progress ?? 0;
  const statusColor = {
    active: "#22C55E", planning: "#9CA3AF", on_hold: "#F59E0B",
    completed: "#60A5FA", cancelled: "#EF4444",
  }[project.status] || "#9CA3AF";

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}28` }}>
        <FolderOpen size={15} style={{ color: statusColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{project.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg,${statusColor},${statusColor}99)` }} />
          </div>
          <span className="text-xs shrink-0" style={{ color: "#6B7280" }}>{pct}%</span>
        </div>
      </div>
      <span className="text-xs font-medium capitalize shrink-0" style={{ color: statusColor }}>
        {project.status?.replace("_", " ")}
      </span>
    </motion.div>
  );
};

// ── Main component ────────────────────────────────────────
const ClientDashboard = () => {
  const {
    invoices, projects, loading, error,
    revenueAnalytics, outstandingBalance, aiInsights,
    fetchDashboard, fetchAnalytics, fetchAiInsights,
    patchInvoice, patchProject,
  } = useClientPortalStore();

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics();

    const onInvoice = (e) => patchInvoice(e.detail.invoiceId, { status: e.detail.status });
    const onProject = (e) => patchProject(e.detail.projectId, { status: e.detail.status, progress: e.detail.progress });
    const onRefresh = () => { fetchDashboard(); fetchAnalytics(); };

    window.addEventListener("invoice:updated",   onInvoice);
    window.addEventListener("project:updated",   onProject);
    window.addEventListener("dashboard:refresh", onRefresh);
    return () => {
      window.removeEventListener("invoice:updated",   onInvoice);
      window.removeEventListener("project:updated",   onProject);
      window.removeEventListener("dashboard:refresh", onRefresh);
    };
  }, []);

  // ── Derived stats ─────────────────────────────────────
  const outstanding    = invoices.filter((i) => ["sent","overdue","viewed"].includes(i.status));
  const totalOwed      = outstanding.reduce((s, i) => s + (i.total || 0), 0);
  const paidInvoices   = invoices.filter((i) => i.status === "paid");
  const activeProjects = invoices.filter ? projects.filter((p) => p.status === "active") : [];
  const overdueInvs    = invoices.filter((i) => i.status === "overdue");
  const totalRevenue   = paidInvoices.reduce((s, i) => s + (i.total || 0), 0);

  // Month-over-month revenue trend
  const now = new Date();
  const thisMonthRev = paidInvoices
    .filter((i) => i.paidAt && new Date(i.paidAt).getMonth() === now.getMonth() && new Date(i.paidAt).getFullYear() === now.getFullYear())
    .reduce((s, i) => s + (i.total || 0), 0);
  const lastMonthRev = paidInvoices
    .filter((i) => {
      if (!i.paidAt) return false;
      const d = new Date(i.paidAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    })
    .reduce((s, i) => s + (i.total || 0), 0);
  const revTrend = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : 0;

  const recentInvoices = [...invoices].slice(0, 5);
  const recentProjects = [...projects].slice(0, 4);

  if (loading.dashboard && invoices.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonStat key={i} />)}
        </div>
      </div>
    );
  }

  if (error.dashboard && invoices.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <AlertCircle size={32} style={{ color: "#EF4444" }} />
        <p className="text-white font-semibold">Failed to load dashboard</p>
        <button onClick={fetchDashboard} className="text-sm px-4 py-2 rounded-lg"
          style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* ── Greeting ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-xl font-bold text-white">Your Overview</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Here's what's happening with your projects and invoices.
        </p>
      </motion.div>

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}   label="Total Revenue"    value={`₹${totalRevenue.toLocaleString()}`}   color="#635BFF" delay={0}    trend={revTrend} sub={`₹${thisMonthRev.toLocaleString()} this month`} />
        <StatCard icon={AlertCircle}  label="Outstanding"      value={`₹${totalOwed.toLocaleString()}`}      color="#EF4444" delay={0.05} sub={`${outstanding.length} pending`} />
        <StatCard icon={FolderOpen}   label="Active Projects"  value={projects.filter(p=>p.status==="active").length} color="#22C55E" delay={0.1} sub={`${projects.length} total`} />
        <StatCard icon={CheckCircle2} label="Paid Invoices"    value={paidInvoices.length}                   color="#00D4FF" delay={0.15} sub={overdueInvs.length > 0 ? `${overdueInvs.length} overdue` : "All clear"} />
      </div>

      {/* ── Overdue alert ── */}
      <AnimatePresence>
        {overdueInvs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertCircle size={16} style={{ color: "#F87171" }} />
            <p className="text-sm flex-1" style={{ color: "#FCA5A5" }}>
              You have <span className="font-bold">{overdueInvs.length}</span> overdue invoice{overdueInvs.length > 1 ? "s" : ""} totalling{" "}
              <span className="font-bold">₹{overdueInvs.reduce((s,i)=>s+(i.total||0),0).toLocaleString()}</span>.
            </p>
            <Link to="/client/invoices" className="text-xs font-semibold flex items-center gap-1 shrink-0"
              style={{ color: "#F87171" }}>
              View <ArrowRight size={12} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Earnings chart (full width) ── */}
      <EarningsSection revenueAnalytics={revenueAnalytics} loading={loading.analytics} />

      {/* ── Two-column: invoices + projects ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Invoices */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
                <FileText size={13} style={{ color: "#A78BFA" }} />
              </div>
              <h2 className="text-sm font-semibold text-white">Recent Invoices</h2>
            </div>
            <Link to="/client/invoices" className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#635BFF" }}
              onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
              onMouseLeave={e => e.currentTarget.style.color = "#635BFF"}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <FileText size={28} style={{ color: "#374151" }} />
              <p className="text-sm" style={{ color: "#6B7280" }}>No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {recentInvoices.map((inv, i) => (
                <motion.div key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{inv.invoiceNumber}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <p className="text-sm font-bold text-white shrink-0">
                    {inv.currency} {inv.total?.toLocaleString()}
                  </p>
                  <StatusBadge status={inv.status} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Projects */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <FolderOpen size={13} style={{ color: "#4ADE80" }} />
              </div>
              <h2 className="text-sm font-semibold text-white">Your Projects</h2>
            </div>
            <Link to="/client/projects" className="text-xs font-medium flex items-center gap-1"
              style={{ color: "#635BFF" }}
              onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
              onMouseLeave={e => e.currentTarget.style.color = "#635BFF"}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <FolderOpen size={28} style={{ color: "#374151" }} />
              <p className="text-sm" style={{ color: "#6B7280" }}>No projects yet</p>
            </div>
          ) : (
            <div className="px-5 py-2">
              {recentProjects.map((p, i) => (
                <ProjectRow key={p._id} project={p} delay={0.35 + i * 0.05} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── AI Insights ── */}
      <AiInsightsPanel
        insights={aiInsights}
        loading={loading.aiInsights}
        onRefresh={fetchAiInsights}
      />
    </div>
  );
};

export default ClientDashboard;
