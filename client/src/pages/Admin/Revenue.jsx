import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Crown,
  ArrowUpRight, ArrowDownRight, Users, Download, BarChart2,
  Activity, Percent, Zap, Award, ChevronRight,
} from "lucide-react";
import useAdminStore from "../../store/adminStore";

// ─── constants ─────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NOISE  = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`;
const EARNER_COLORS = ["#635BFF","#22D3EE","#A78BFA","#F59E0B","#10B981"];
const PLAN_COLORS   = { free: "#4B5563", pro: "#818CF8", premium: "#F59E0B" };

// ─── formatters ────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `₹${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₹${(n/1_000).toFixed(1)}K`;
  return `₹${Number(n).toFixed(0)}`;
};
const fmtShort = (v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v;

// ─── Chart Tooltip ─────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="px-3 py-2.5 rounded-xl text-xs min-w-[120px]"
      style={{ background: "rgba(8,12,28,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <p className="mb-1.5 font-semibold" style={{ color: "rgba(148,163,184,0.8)" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill || "#635BFF" }} />
          <span className="font-bold text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </motion.div>
  );
};

// ─── Sparkline (mini chart inside KPI card) ────────────────────────────────
const Sparkline = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`sp-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0}   />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
        fill={`url(#sp-${color.replace("#","")})`} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── KPI Summary Card ──────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, sub, color, trend, spark, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -4, boxShadow: `0 20px 60px ${color}20` }}
    className="relative overflow-hidden rounded-2xl p-5 cursor-default"
    style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(14px)",
      border: `1px solid ${color}22`,
      boxShadow: `0 0 40px ${color}08`,
    }}
  >
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: `radial-gradient(ellipse 80% 70% at 90% 10%, ${color}12 0%, transparent 65%)` }} />
    <div className="absolute inset-x-0 top-0 h-px"
      style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30`, boxShadow: `0 0 16px ${color}20` }}>
        <Icon size={17} style={{ color }} />
      </div>
      {trend != null && (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
          style={{
            background: trend >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            color: trend >= 0 ? "#4ADE80" : "#F87171",
            border: trend >= 0 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)",
          }}>
          {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>

    <p className="text-[26px] font-black text-white tracking-tight leading-none mb-0.5">{value}</p>
    <p className="text-[12px] font-semibold mb-3" style={{ color: "rgba(148,163,184,0.7)" }}>{label}</p>
    {sub && <p className="text-[11px] mb-2" style={{ color: "rgba(100,116,139,0.6)" }}>{sub}</p>}

    {spark?.length > 0 && <Sparkline data={spark} color={color} />}
  </motion.div>
);

// ─── Glass Card wrapper ────────────────────────────────────────────────────
const GlassCard = ({ children, delay, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 0 40px rgba(99,102,241,0.06)",
    }}
  >
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{ background: "linear-gradient(90deg, transparent, rgba(99,91,255,0.35), transparent)" }} />
    {children}
  </motion.div>
);

// ─── Metric pill ───────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -2 }}
    className="relative overflow-hidden rounded-2xl p-4"
    style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(14px)",
      border: `1px solid ${color}20`,
    }}
  >
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: `radial-gradient(ellipse 80% 60% at 80% 20%, ${color}0e 0%, transparent 70%)` }} />
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}28` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(100,116,139,0.7)" }}>{label}</p>
    </div>
    <p className="text-xl font-black text-white tracking-tight">{value}</p>
  </motion.div>
);

// ─── Empty State ───────────────────────────────────────────────────────────
const EmptyState = ({ message = "No data yet" }) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.15)" }}>
      <BarChart2 size={28} style={{ color: "rgba(99,91,255,0.4)" }} />
    </div>
    <p className="text-sm font-semibold text-white mb-1">No revenue data yet</p>
    <p className="text-xs max-w-[200px]" style={{ color: "rgba(100,116,139,0.6)" }}>
      Start generating revenue to unlock insights
    </p>
  </div>
);

// ─── Top Earner Row ────────────────────────────────────────────────────────
const EarnerRow = ({ earner, rank }) => {
  const initials = earner.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "?";
  const color    = EARNER_COLORS[rank % EARNER_COLORS.length];
  const medals   = ["🥇","🥈","🥉"];
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.06, duration: 0.35 }}
      className="flex items-center gap-3 py-3 group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span className="text-base w-6 shrink-0 text-center">{medals[rank] || `${rank+1}`}</span>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, boxShadow: `0 0 12px ${color}40` }}>
        {earner.avatar
          ? <img src={earner.avatar} alt={earner.name} className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white truncate">{earner.name}</p>
        <p className="text-[11px] truncate" style={{ color: "rgba(100,116,139,0.65)" }}>{earner.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-bold text-white">{fmt(earner.total)}</p>
        <p className="text-[10px]" style={{ color: "rgba(100,116,139,0.6)" }}>{earner.invoices} inv.</p>
      </div>
    </motion.div>
  );
};

// ─── Plan Donut ────────────────────────────────────────────────────────────
const PlanDonut = ({ byPlan }) => {
  const p = byPlan || {};
  const data = [
    { name: "Free",    value: p.free?.count    || 0, color: PLAN_COLORS.free    },
    { name: "Pro",     value: p.pro?.count     || 0, color: PLAN_COLORS.pro     },
    { name: "Premium", value: p.premium?.count || 0, color: PLAN_COLORS.premium },
  ].filter(d => d.value > 0);
  const total = data.reduce((s,d) => s + d.value, 0);
  if (!total) return <EmptyState />;
  return (
    <div className="flex items-center gap-6 pt-2">
      <PieChart width={120} height={120}>
        <Pie data={data} cx={60} cy={60} innerRadius={36} outerRadius={54}
          dataKey="value" strokeWidth={0} paddingAngle={3}>
          {data.map((d,i) => <Cell key={i} fill={d.color} />)}
        </Pie>
      </PieChart>
      <div className="space-y-3 flex-1">
        {data.map(d => (
          <div key={d.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[12px] font-medium" style={{ color: "rgba(148,163,184,0.8)" }}>{d.name}</span>
              </div>
              <span className="text-[12px] font-bold text-white">{Math.round((d.value/total)*100)}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(d.value/total)*100}%` }}
                transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full" style={{ background: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CSV Export ────────────────────────────────────────────────────────────
const exportCSV = (data) => {
  const rows = [["Month","Revenue","Invoices"], ...data.map(r => [r.month, r.revenue, r.invoices])];
  const csv  = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = "revenue.csv"; a.click();
  URL.revokeObjectURL(url);
};

// ─── Toggle Button Group ───────────────────────────────────────────────────
const ToggleGroup = ({ options, value, onChange }) => (
  <div className="flex rounded-xl overflow-hidden p-0.5"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)}
        className="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200"
        style={{
          background: value === o.value ? "rgba(99,91,255,0.25)" : "transparent",
          color: value === o.value ? "#A78BFA" : "rgba(100,116,139,0.7)",
          boxShadow: value === o.value ? "0 0 12px rgba(99,91,255,0.2)" : "none",
        }}>
        {o.label}
      </button>
    ))}
  </div>
);

// ─── Main Revenue Page ─────────────────────────────────────────────────────
const AdminRevenue = () => {
  const { revenue, revenueSummary, isLoading, fetchRevenue, fetchRevenueSummary } = useAdminStore();
  const [months, setMonths]       = useState(12);
  const [chartType, setChartType] = useState("area");
  const [rightTab, setRightTab]   = useState("earners");

  useEffect(() => { fetchRevenueSummary(); }, []);
  useEffect(() => { fetchRevenue(months); }, [months]);

  const chartData = (revenue || []).map(r => ({
    month:    MONTHS[(r.month || 1) - 1],
    revenue:  r.revenue  || 0,
    invoices: r.count    || 0,
  }));

  // build sparkline data from chart (last 6 points)
  const spark = chartData.slice(-6).map(d => ({ v: d.revenue }));

  const s      = revenueSummary;
  const growth = s?.growth != null ? parseFloat(s.growth) : null;

  // derived metrics
  const arpu = (s?.total && s?.totalCount) ? Math.round(s.total / s.totalCount) : null;
  const paidUsers = (s?.byPlan?.pro?.count || 0) + (s?.byPlan?.premium?.count || 0);
  const convRate  = null; // would need total users — placeholder

  const kpis = [
    { icon: DollarSign, label: "Total Revenue",  value: fmt(s?.total),     sub: `${s?.totalCount ?? "—"} paid invoices`, color: "#635BFF", trend: null,   delay: 0,    spark },
    { icon: TrendingUp, label: "This Month",     value: fmt(s?.thisMonth), sub: "vs last month",                         color: "#10B981", trend: growth, delay: 0.07, spark: chartData.slice(-3).map(d=>({v:d.revenue})) },
    { icon: FileText,   label: "Last Month",     value: fmt(s?.lastMonth), sub: "Previous period",                       color: "#F59E0B", trend: null,   delay: 0.14, spark: [] },
    { icon: Crown,      label: "Premium Rev.",   value: fmt(s?.byPlan?.premium?.revenue), sub: `${s?.byPlan?.premium?.count ?? 0} premium users`, color: "#A78BFA", trend: null, delay: 0.21, spark: [] },
  ];

  const advMetrics = [
    { icon: Users,    label: "Paid Users",   value: paidUsers || "—",    color: "#22D3EE" },
    { icon: Zap,      label: "ARPU",         value: fmt(arpu),           color: "#818CF8" },
    { icon: Activity, label: "MoM Growth",   value: growth != null ? `${growth > 0 ? "+" : ""}${growth}%` : "—", color: growth >= 0 ? "#4ADE80" : "#F87171" },
    { icon: Award,    label: "Top Earners",  value: s?.topEarners?.length || "—", color: "#F59E0B" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{
        background: `${NOISE}, radial-gradient(ellipse 90% 60% at 70% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), linear-gradient(180deg, #0B0F1A 0%, #080C18 100%)`,
      }}
    >
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-1/3 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,91,255,0.06) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 65%)" }} />
      </div>

      <div className="relative p-6 lg:p-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] font-black tracking-tight leading-none"
              style={{ background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Revenue Analytics
            </h1>
            <p className="text-sm mt-2" style={{ color: "rgba(100,116,139,0.75)" }}>
              Understand your business performance
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ToggleGroup
              options={[{value:"area",label:"Area"},{value:"bar",label:"Bar"},{value:"line",label:"Line"}]}
              value={chartType} onChange={setChartType} />
            <ToggleGroup
              options={[{value:3,label:"3m"},{value:6,label:"6m"},{value:12,label:"12m"}]}
              value={months} onChange={setMonths} />
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => exportCSV(chartData)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(148,163,184,0.8)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(148,163,184,0.8)"; }}>
              <Download size={13} /> Export CSV
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map(k => <KPICard key={k.label} {...k} />)}
        </div>

        {/* ── Advanced Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {advMetrics.map((m, i) => <MetricCard key={m.label} {...m} delay={0.1 + i * 0.05} />)}
        </div>

        {/* ── Main Chart + Right Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Main chart */}
          <GlassCard delay={0.2} className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[14px] font-bold text-white">Revenue Trend</p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(100,116,139,0.7)" }}>Last {months} months</p>
              </div>
              {growth != null && (
                <span className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full"
                  style={{
                    background: growth >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: growth >= 0 ? "#4ADE80" : "#F87171",
                    border: growth >= 0 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)",
                  }}>
                  {growth >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {Math.abs(growth)}% MoM
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="h-[260px] rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ) : chartData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                {chartType === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#635BFF" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} />
                    <YAxis stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} tickFormatter={fmtShort} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(99,91,255,0.06)" }} />
                    <Bar dataKey="revenue" fill="url(#bar-grad)" radius={[6,6,0,0]} maxBarSize={40} />
                  </BarChart>
                ) : chartType === "line" ? (
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} />
                    <YAxis stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} tickFormatter={fmtShort} />
                    <Tooltip content={<ChartTip />} />
                    <Line type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2.5}
                      dot={{ fill: "#635BFF", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#A78BFA", strokeWidth: 0 }} />
                  </LineChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#635BFF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#635BFF" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} />
                    <YAxis stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} tickFormatter={fmtShort} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2.5}
                      fill="url(#area-grad)" dot={false} activeDot={{ r: 5, fill: "#A78BFA", strokeWidth: 0 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </GlassCard>

          {/* Right panel — tabs */}
          <GlassCard delay={0.28} className="p-5 flex flex-col">
            {/* tab bar */}
            <div className="flex gap-1 mb-4 p-0.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[{v:"earners",l:"Top Earners"},{v:"invoices",l:"Invoices"}].map(t => (
                <button key={t.v} onClick={() => setRightTab(t.v)}
                  className="flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200"
                  style={{
                    background: rightTab === t.v ? "rgba(99,91,255,0.2)" : "transparent",
                    color: rightTab === t.v ? "#A78BFA" : "rgba(100,116,139,0.65)",
                  }}>
                  {t.l}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {rightTab === "earners" ? (
                <motion.div key="earners" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex-1">
                  {!s?.topEarners?.length
                    ? <EmptyState />
                    : (s.topEarners || []).map((e, i) => <EarnerRow key={i} earner={e} rank={i} />)
                  }
                </motion.div>
              ) : (
                <motion.div key="invoices" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex-1">
                  {chartData.length === 0 ? <EmptyState /> : (
                    <div className="space-y-0">
                      {chartData.slice(-6).reverse().map((d, i) => (
                        <div key={i} className="flex items-center justify-between py-3"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div>
                            <p className="text-[13px] font-semibold text-white">{d.month}</p>
                            <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.6)" }}>{d.invoices} invoices</p>
                          </div>
                          <p className="text-[13px] font-bold text-white">{fmt(d.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>

        {/* ── Secondary Insights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Plan Distribution */}
          <GlassCard delay={0.34} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.25)" }}>
                <Percent size={13} style={{ color: "#818CF8" }} />
              </div>
              <p className="text-[13px] font-bold text-white">Plan Distribution</p>
            </div>
            <PlanDonut byPlan={s?.byPlan} />
          </GlassCard>

          {/* Revenue by plan bar */}
          <GlassCard delay={0.4} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.25)" }}>
                <BarChart2 size={13} style={{ color: "#635BFF" }} />
              </div>
              <p className="text-[13px] font-bold text-white">Revenue by Plan</p>
            </div>
            {!s?.byPlan ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[
                  { name: "Free",    rev: s.byPlan?.free?.revenue    || 0, fill: PLAN_COLORS.free    },
                  { name: "Pro",     rev: s.byPlan?.pro?.revenue     || 0, fill: PLAN_COLORS.pro     },
                  { name: "Premium", rev: s.byPlan?.premium?.revenue || 0, fill: PLAN_COLORS.premium },
                ]} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(99,91,255,0.06)" }} />
                  <Bar dataKey="rev" radius={[6,6,0,0]} maxBarSize={48}>
                    {[PLAN_COLORS.free, PLAN_COLORS.pro, PLAN_COLORS.premium].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassCard>

          {/* Invoice trend (count) */}
          <GlassCard delay={0.46} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.22)" }}>
                <FileText size={13} style={{ color: "#22D3EE" }} />
              </div>
              <p className="text-[13px] font-bold text-white">Invoice Volume</p>
            </div>
            {chartData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inv-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="px-3 py-2 rounded-xl text-xs"
                        style={{ background: "rgba(8,12,28,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <p style={{ color: "rgba(148,163,184,0.7)" }}>{label}</p>
                        <p className="font-bold text-white">{payload[0].value} invoices</p>
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="invoices" stroke="#22D3EE" strokeWidth={2}
                    fill="url(#inv-grad)" dot={false} activeDot={{ r: 4, fill: "#22D3EE", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default AdminRevenue;
