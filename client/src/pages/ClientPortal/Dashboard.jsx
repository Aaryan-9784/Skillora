import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileText, FolderOpen, DollarSign, CheckCircle2,
  AlertCircle, ArrowRight, TrendingUp, TrendingDown,
  Clock, CreditCard, Activity, Bell, Calendar,
  ExternalLink, Sparkles, BarChart2, FolderKanban, RefreshCw,
  Zap, ArrowUpRight, Check, ShieldCheck,
} from "lucide-react";
import useClientPortalStore from "../../store/clientPortalStore";
import useAuthStore from "../../store/authStore";
import KPIWidget from "../../components/dashboard/KPIWidget";
import { formatCurrency, formatDate, relativeTime } from "../../utils/helpers";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3.5 py-2.5 rounded-xl text-xs"
      style={{
        background: "rgba(6,9,22,0.97)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        backdropFilter: "blur(16px)",
      }}>
      <p className="text-[11px] mb-1 font-semibold" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || "#635BFF" }} />
          <span className="font-bold text-white text-xs">₹{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
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

// ── Shared Status Badge ────────────────────────────────────────────────────
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

const GlassSkeleton = ({ className = "" }) => (
  <div className={`rounded-2xl animate-pulse ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
);

// ── Revenue Overview Section ───────────────────────────────────────────────
const EarningsSection = ({ revenueAnalytics = [], loading }) => {
  const [period, setPeriod] = useState("6m");
  const chartData = useMemo(() => {
    const now = new Date();
    const monthsBack = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    const result = [];
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const found = (revenueAnalytics || []).find(
        (r) => r.year === d.getFullYear() && r.month === d.getMonth() + 1
      );
      result.push({
        label:   MONTHS[d.getMonth()],
        revenue: found?.revenue || 0,
        count:   found?.invoiceCount || 0,
      });
    }
    return result;
  }, [revenueAnalytics, period]);

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const prevHalf     = chartData.slice(0, Math.floor(chartData.length / 2)).reduce((s, d) => s + d.revenue, 0);
  const currHalf     = chartData.slice(Math.floor(chartData.length / 2)).reduce((s, d) => s + d.revenue, 0);
  const trendPct     = prevHalf > 0 ? Math.round(((currHalf - prevHalf) / prevHalf) * 100) : 0;

  return (
    <GCard delay={0.2} glow="#635BFF" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.3)", boxShadow: "0 0 16px rgba(99,91,255,0.2)" }}>
            <BarChart2 size={16} style={{ color: "#A78BFA" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Revenue Overview</h2>
            <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.65)" }}>Track your paid invoices & total spending over time</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-black text-white tracking-tight">₹{totalRevenue.toLocaleString()}</p>
            <div className="flex items-center justify-end gap-1 text-xs font-bold"
              style={{ color: trendPct >= 0 ? "#4ADE80" : "#F87171" }}>
              {trendPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trendPct)}% vs prior period</span>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {["3m","6m","1y"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                style={{
                  background: period === p ? "linear-gradient(135deg,rgba(99,91,255,0.35) 0%,rgba(139,92,246,0.2) 100%)" : "transparent",
                  color: period === p ? "#EDE9FE" : "rgba(148,163,184,0.6)",
                  border: period === p ? "1px solid rgba(99,91,255,0.4)" : "1px solid transparent",
                  boxShadow: period === p ? "0 0 12px rgba(99,91,255,0.25)" : "none",
                }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#635BFF" }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : (
        <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clientRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#635BFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#635BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(148,163,184,0.5)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "rgba(148,163,184,0.5)" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTooltip />}
                cursor={{ stroke: "#635BFF", strokeWidth: 1.5, strokeDasharray: "4 4", opacity: 0.6 }} />
              <Area type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2.5}
                fill="url(#clientRevGrad)" dot={false}
                activeDot={{ r: 5, fill: "#A78BFA", stroke: "#635BFF", strokeWidth: 2, filter: "drop-shadow(0 0 8px #635BFF)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </GCard>
  );
};

// ── AI Insights Panel ───────────────────────────────────────────────────────
const AiInsightsPanel = ({ insights, loading, onRefresh }) => (
  <GCard delay={0.35} glow="#8B5CF6">
    <div className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 16px rgba(139,92,246,0.2)" }}>
          <Sparkles size={15} style={{ color: "#A78BFA" }} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Skillora AI Assistant</h2>
          <p className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>Smart project insights & financial recommendations</p>
        </div>
      </div>
      <button onClick={onRefresh} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40 cursor-pointer"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.8)" }}
        onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(148,163,184,0.8)"}>
        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        <span>Analyze</span>
      </button>
    </div>

    <div className="p-6">
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-4 rounded-lg" style={{ width: `${85 - i * 10}%` }} />
          ))}
        </div>
      ) : !insights ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <Sparkles size={22} style={{ color: "#A78BFA" }} />
          </div>
          <p className="text-xs text-center font-medium max-w-sm" style={{ color: "rgba(148,163,184,0.65)" }}>
            No custom insights generated yet. Click analyze to generate project health & payment summaries.
          </p>
          <button onClick={onRefresh}
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            style={{ background: "linear-gradient(135deg,rgba(99,91,255,0.3) 0%,rgba(139,92,246,0.2) 100%)", color: "#EDE9FE", border: "1px solid rgba(99,91,255,0.4)" }}>
            Generate AI Insights
          </button>
        </div>
      ) : (
        <div className="text-xs leading-relaxed whitespace-pre-wrap font-medium" style={{ color: "#D1D5DB" }}>
          {typeof insights === "string" ? insights : JSON.stringify(insights, null, 2)}
        </div>
      )}
    </div>
  </GCard>
);

// ── Project Progress Row ───────────────────────────────────────────────────
const ProjectRow = ({ project, delay }) => {
  const pct = project.progress ?? 0;
  const statusColor = {
    active: "#22C55E", planning: "#9CA3AF", on_hold: "#F59E0B",
    completed: "#60A5FA", cancelled: "#EF4444",
  }[project.status] || "#9CA3AF";

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 py-3.5 px-1 group cursor-pointer hover:bg-white/[0.02] rounded-xl transition-colors"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}30`, boxShadow: `0 0 12px ${statusColor}15` }}>
        <FolderOpen size={16} style={{ color: statusColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{project.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg,${statusColor},${statusColor}99)` }} />
          </div>
          <span className="text-[11px] font-semibold shrink-0" style={{ color: "rgba(148,163,184,0.6)" }}>{pct}%</span>
        </div>
      </div>
      <span className="text-[11px] font-bold capitalize shrink-0 px-2.5 py-0.5 rounded-full"
        style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}25` }}>
        {project.status?.replace("_", " ")}
      </span>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
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

  // ── Derived Stats ────────────────────────────────────────────────────────
  const outstanding    = invoices.filter((i) => ["sent","overdue","viewed"].includes(i.status));
  const totalOwed      = outstanding.reduce((s, i) => s + (i.total || 0), 0);
  const paidInvoices   = invoices.filter((i) => i.status === "paid");
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
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <GlassSkeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (error.dashboard && invoices.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <AlertCircle size={32} style={{ color: "#EF4444" }} />
        <p className="text-white font-semibold">Failed to load dashboard</p>
        <button onClick={fetchDashboard} className="text-xs font-bold px-4 py-2 rounded-xl"
          style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
          Retry
        </button>
      </div>
    );
  }

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
              style={{ background: "linear-gradient(135deg,#FFFFFF 30%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Overview
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Key metrics, active projects, and financial insights
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { fetchDashboard(); fetchAnalytics(); }}
              title="Refresh Data"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.75)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.75)"; }}
            >
              <RefreshCw size={15} className={loading.dashboard ? "animate-spin text-indigo-400" : ""} />
            </motion.button>

            <Link to="/client/projects">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.3)" }}
              >
                <FolderOpen size={14} />
                <span>Projects</span>
              </motion.button>
            </Link>

            <Link to="/client/invoices">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.3)" }}
              >
                <FileText size={14} />
                <span>Invoices</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget icon={FolderOpen}   label="Active Projects"    value={projects.filter(p=>p.status==="active").length} color="success" trendLabel={`${projects.length} total project(s)`} />
        <KPIWidget icon={DollarSign}   label="Total Revenue Paid" value={`₹${totalRevenue.toLocaleString()}`}   color="brand" trendLabel={`₹${thisMonthRev.toLocaleString()} this month`} />
        <KPIWidget icon={AlertCircle}  label="Outstanding Balance" value={`₹${totalOwed.toLocaleString()}`}      color="warning" trendLabel={`${outstanding.length} pending invoice(s)`} />
        <KPIWidget icon={CheckCircle2} label="Paid Invoices"      value={paidInvoices.length}                   color="cyan" trendLabel={overdueInvs.length > 0 ? `${overdueInvs.length} overdue` : "All clear"} />
      </div>

      {/* ── Overdue Alert Banner ── */}
      <AnimatePresence>
        {overdueInvs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 0 24px rgba(239,68,68,0.1)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.2)" }}>
              <AlertCircle size={17} style={{ color: "#F87171" }} />
            </div>
            <p className="text-xs font-semibold flex-1" style={{ color: "#FCA5A5" }}>
              You have <span className="font-bold text-white">{overdueInvs.length}</span> overdue invoice{overdueInvs.length > 1 ? "s" : ""} totalling{" "}
              <span className="font-bold text-white">₹{overdueInvs.reduce((s,i)=>s+(i.total||0),0).toLocaleString()}</span>. Please settle payment to prevent project delays.
            </p>
            <Link to="/client/invoices" className="text-xs font-bold flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "rgba(239,68,68,0.2)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span>Pay Now</span> <ArrowRight size={13} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Revenue Chart Section ── */}
      <EarningsSection revenueAnalytics={revenueAnalytics} loading={loading.analytics} />

      {/* ── Two-Column Widgets (Projects + Invoices) ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Projects Widget */}
        <GCard delay={0.25} glow="#22C55E" className="p-0">
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <FolderOpen size={15} style={{ color: "#4ADE80" }} />
              </div>
              <h2 className="text-sm font-bold text-white">Your Projects</h2>
            </div>
            <Link to="/client/projects" className="text-xs font-bold flex items-center gap-1 transition-colors"
              style={{ color: "#22C55E" }}
              onMouseEnter={e => e.currentTarget.style.color = "#4ADE80"}
              onMouseLeave={e => e.currentTarget.style.color = "#22C55E"}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <FolderOpen size={20} style={{ color: "rgba(148,163,184,0.4)" }} />
              </div>
              <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>No projects active yet</p>
            </div>
          ) : (
            <div className="px-6 py-3">
              {recentProjects.map((p, i) => (
                <ProjectRow key={p._id} project={p} delay={0.25 + i * 0.05} />
              ))}
            </div>
          )}
        </GCard>

        {/* Recent Invoices Widget */}
        <GCard delay={0.3} glow="#635BFF" className="p-0">
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.3)" }}>
                <FileText size={15} style={{ color: "#A78BFA" }} />
              </div>
              <h2 className="text-sm font-bold text-white">Recent Invoices</h2>
            </div>
            <Link to="/client/invoices" className="text-xs font-bold flex items-center gap-1 transition-colors"
              style={{ color: "#8B5CF6" }}
              onMouseEnter={e => e.currentTarget.style.color = "#A78BFA"}
              onMouseLeave={e => e.currentTarget.style.color = "#8B5CF6"}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <FileText size={20} style={{ color: "rgba(148,163,184,0.4)" }} />
              </div>
              <p className="text-xs font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>No invoices generated yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {recentInvoices.map((inv, i) => (
                <motion.div key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{inv.invoiceNumber}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <p className="text-xs font-black text-white shrink-0">
                    {inv.currency} {inv.total?.toLocaleString()}
                  </p>
                  <StatusBadge status={inv.status} />
                </motion.div>
              ))}
            </div>
          )}
        </GCard>
      </div>

      {/* ── AI Insights ── */}
      <AiInsightsPanel
        insights={aiInsights}
        loading={loading.aiInsights}
        onRefresh={fetchAiInsights}
      />
      </div>
    </div>
  );
};

export default ClientDashboard;
