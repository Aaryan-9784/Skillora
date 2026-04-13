// Admin Overview — written to overview.jsx to avoid editor file-lock on index.jsx
// App.jsx imports this via: import AdminOverview from "./pages/Admin/overview"
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, TrendingUp, CreditCard, Activity, FolderKanban,
  Bot, UserPlus, DollarSign, CheckCircle, ArrowUpRight,
  ArrowDownRight, RefreshCw, BarChart2, Bell, Shield,
  FileText, Zap, UserCheck,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import useAdminStore from "../../store/adminStore";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PLAN_COLORS = { free: "#4B5563", pro: "#818CF8", premium: "#FBBF24" };

const fmt = n => {
  if (n == null) return "—";
  if (n >= 1000000) return "₹" + (n/1000000).toFixed(1) + "M";
  if (n >= 1000)    return "₹" + (n/1000).toFixed(1) + "K";
  return "₹" + n;
};
const fmtNum = n => n == null ? "—" : Number(n).toLocaleString();

const Spark = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={36}>
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={"sk" + color.replace("#","")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
          <stop offset="95%" stopColor={color} stopOpacity={0}    />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
        fill={"url(#sk" + color.replace("#","") + ")"} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

const ChartTip = ({ active, payload, label, money }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-xs"
      style={{ background: "rgba(6,9,22,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <p className="mb-1.5 font-semibold" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill || "#635BFF" }} />
          <span className="font-bold text-white">{money ? fmt(p.value) : fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const GCard = ({ children, delay, className, glow }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.5, ease: [0.16,1,0.3,1] }}
    className={"relative overflow-hidden rounded-2xl " + (className || "")}
    style={{
      background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: glow ? ("0 0 60px " + glow + "12") : "0 0 40px rgba(99,91,255,0.05)",
    }}
  >
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{ background: glow
        ? ("linear-gradient(90deg,transparent," + glow + "55,transparent)")
        : "linear-gradient(90deg,transparent,rgba(99,91,255,0.3),transparent)" }} />
    {children}
  </motion.div>
);

const KPICard = ({ icon: Icon, label, value, sub, color, trend, spark, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.5, ease: [0.16,1,0.3,1] }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="relative overflow-hidden rounded-2xl p-5 cursor-default group"
    style={{
      background: "linear-gradient(145deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)",
      border: "1px solid " + color + "25", backdropFilter: "blur(16px)",
    }}
  >
    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none transition-all duration-500 group-hover:scale-150 opacity-70"
      style={{ background: "radial-gradient(circle," + color + "1e 0%,transparent 70%)" }} />
    <div className="absolute inset-x-0 top-0 h-px"
      style={{ background: "linear-gradient(90deg,transparent," + color + "60,transparent)" }} />
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: color + "18", border: "1px solid " + color + "35", boxShadow: "0 0 18px " + color + "22" }}>
        <Icon size={18} style={{ color }} />
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
    <p className="text-[27px] font-black text-white tracking-tight leading-none mb-0.5">{value}</p>
    <p className="text-[12px] font-semibold mb-2" style={{ color: "rgba(148,163,184,0.72)" }}>{label}</p>
    {sub && <p className="text-[11px] mb-2" style={{ color: "rgba(100,116,139,0.55)" }}>{sub}</p>}
    {spark && spark.length > 1 && <Spark data={spark} color={color} />}
  </motion.div>
);

const PlanDonut = ({ plans }) => {
  const p = plans || {};
  const data = [
    { name: "Free",    value: p.free    || 0, color: PLAN_COLORS.free    },
    { name: "Pro",     value: p.pro     || 0, color: PLAN_COLORS.pro     },
    { name: "Premium", value: p.premium || 0, color: PLAN_COLORS.premium },
  ].filter(d => d.value > 0);
  const total = data.reduce((s,d) => s + d.value, 0);
  if (!total) return (
    <div className="flex flex-col items-center justify-center h-28 gap-2">
      <BarChart2 size={24} style={{ color: "rgba(100,116,139,0.3)" }} />
      <p className="text-xs" style={{ color: "rgba(100,116,139,0.45)" }}>No plan data yet</p>
    </div>
  );
  return (
    <div className="flex items-center gap-5">
      <PieChart width={100} height={100}>
        <Pie data={data} cx={50} cy={50} innerRadius={28} outerRadius={46}
          dataKey="value" strokeWidth={0} paddingAngle={4}>
          {data.map((d,i) => <Cell key={i} fill={d.color} />)}
        </Pie>
      </PieChart>
      <div className="space-y-2.5 flex-1">
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
              <motion.div initial={{ width: 0 }} animate={{ width: (d.value/total*100) + "%" }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full" style={{ background: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityItem = ({ event, i }) => {
  const isJoin = event.type === "user_joined";
  const color  = isJoin ? "#38BDF8" : "#4ADE80";
  const Icon   = isJoin ? UserPlus : CheckCircle;
  const label  = isJoin
    ? (event.name + " joined as " + event.role)
    : ("Invoice #" + event.invoiceNumber + " paid — " + fmt(event.amount));
  const sub  = isJoin ? event.email : event.ownerName;
  const time = event.at ? new Date(event.at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "";
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05, duration: 0.35 }}
      className="flex items-start gap-3.5 py-3.5 group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: color + "14", border: "1px solid " + color + "28", boxShadow: "0 0 10px " + color + "20" }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white truncate group-hover:text-indigo-300 transition-colors duration-150">{label}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(100,116,139,0.65)" }}>{sub}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-[11px]" style={{ color: "rgba(100,116,139,0.5)" }}>{time}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: color + "14", color, border: "1px solid " + color + "22" }}>
          {isJoin ? "Signup" : "Payment"}
        </span>
      </div>
    </motion.div>
  );
};

const QAction = ({ icon: Icon, label, color, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.16,1,0.3,1] }}
    whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-200"
    style={{ background: color + "0d", border: "1px solid " + color + "22" }}
    onMouseEnter={e => e.currentTarget.style.background = color + "18"}
    onMouseLeave={e => e.currentTarget.style.background = color + "0d"}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: color + "18", border: "1px solid " + color + "30", boxShadow: "0 0 16px " + color + "20" }}>
      <Icon size={18} style={{ color }} />
    </div>
    <p className="text-[11px] font-bold text-center leading-tight whitespace-pre-line"
      style={{ color: "rgba(148,163,184,0.8)" }}>{label}</p>
  </motion.button>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className="px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all duration-200"
    style={{
      background: active ? "rgba(99,91,255,0.22)" : "transparent",
      color: active ? "#A78BFA" : "rgba(100,116,139,0.65)",
      boxShadow: active ? "0 0 12px rgba(99,91,255,0.2)" : "none",
    }}>
    {label}
  </button>
);

const AdminOverview = () => {
  const navigate = useNavigate();
  const { stats, revenue, activity, isLoading, fetchStats, fetchRevenue, fetchActivity } = useAdminStore();
  const [chartTab, setChartTab] = useState("revenue");
  const [rightTab, setRightTab] = useState("plans");
  const [period, setPeriod]     = useState(6);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRevenue(period);
    fetchActivity({ limit: 10 });
  }, [period]);

  const handleRefresh = async () => {
    setSpinning(true);
    await Promise.all([fetchStats(), fetchRevenue(period), fetchActivity({ limit: 10 })]);
    setSpinning(false);
  };

  const chartData = (revenue || []).map(r => ({
    month: MONTHS[(r.month || 1) - 1], revenue: r.revenue || 0, count: r.count || 0,
  }));
  const revSpark = chartData.slice(-6).map(d => ({ v: d.revenue }));
  const cntSpark = chartData.slice(-6).map(d => ({ v: d.count   }));

  const kpis = [
    { icon: Users,        label: "Total Users",   value: fmtNum(stats && stats.totalUsers),    sub: "+" + fmtNum(stats && stats.newUsers) + " this month", color: "#635BFF", spark: cntSpark, delay: 0    },
    { icon: UserCheck,    label: "Active (30d)",  value: fmtNum(stats && stats.activeToday),   sub: "Unique logins",                                        color: "#10B981", spark: [],       delay: 0.07 },
    { icon: DollarSign,   label: "Total Revenue", value: fmt(stats && stats.mrr),              sub: "All-time paid invoices",                               color: "#F59E0B", spark: revSpark, delay: 0.14 },
    { icon: CreditCard,   label: "Paid Users",    value: fmtNum(stats && stats.paidUsers),     sub: "Pro + Premium",                                        color: "#00D4FF", spark: [],       delay: 0.21 },
    { icon: FolderKanban, label: "Projects",      value: fmtNum(stats && stats.totalProjects), sub: "Platform-wide",                                        color: "#F43F5E", spark: [],       delay: 0.28 },
    { icon: Bot,          label: "AI Requests",   value: fmtNum(stats && stats.aiRequests),    sub: "Last 30 days",                                         color: "#A78BFA", spark: [],       delay: 0.35 },
  ];

  const quickActions = [
    { icon: Shield,   label: "Manage\nAdmins",  color: "#A78BFA", fn: () => navigate("/admin/users")    },
    { icon: Bell,     label: "Notifications",   color: "#38BDF8", fn: () => {}                          },
    { icon: FileText, label: "View\nRevenue",   color: "#FBBF24", fn: () => navigate("/admin/revenue")  },
    { icon: Zap,      label: "AI\nSettings",    color: "#F43F5E", fn: () => navigate("/admin/settings") },
  ];

  const segData = (() => {
    const p = (stats && stats.plans) || {};
    return [
      { name: "Free",    v: p.free    || 0, color: "#4B5563" },
      { name: "Pro",     v: p.pro     || 0, color: "#818CF8" },
      { name: "Premium", v: p.premium || 0, color: "#FBBF24" },
    ];
  })();

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.055) 0%,transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(56,189,248,0.03) 0%,transparent 65%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-start justify-between gap-5 mb-8">
          <div>
            <h1 className="text-[30px] font-black tracking-tight leading-none"
              style={{ background: "linear-gradient(135deg,#FFFFFF 25%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Platform Overview
            </h1>
            <p className="text-[13px] mt-2" style={{ color: "rgba(100,116,139,0.7)" }}>Real-time snapshot of your business</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {[3,6,12].map(m => (
                <button key={m} onClick={() => setPeriod(m)}
                  className="px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all duration-200"
                  style={{ background: period === m ? "rgba(99,91,255,0.25)" : "transparent", color: period === m ? "#A78BFA" : "rgba(100,116,139,0.65)" }}>
                  {m}m
                </button>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRefresh}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.7)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.7)"; }}>
              <motion.span animate={{ rotate: spinning ? 360 : 0 }}
                transition={{ duration: 0.6, ease: "linear", repeat: spinning ? Infinity : 0 }}>
                <RefreshCw size={14} />
              </motion.span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/admin/revenue")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.3)" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 32px rgba(99,91,255,0.5)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(99,91,255,0.3)"}>
              <TrendingUp size={13} />Full Analytics
            </motion.button>
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_,i) => (
                <div key={i} className="rounded-2xl p-5 animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", minHeight: 140 }} />
              ))
            : kpis.map(k => <KPICard key={k.label} {...k} />)
          }
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <GCard delay={0.2} className="lg:col-span-2 p-5" glow="#635BFF">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-bold text-white">Analytics Overview</p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(100,116,139,0.65)" }}>Last {period} months</p>
              </div>
              <div className="flex p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <TabBtn label="Revenue"  active={chartTab === "revenue"}  onClick={() => setChartTab("revenue")}  />
                <TabBtn label="Invoices" active={chartTab === "invoices"} onClick={() => setChartTab("invoices")} />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={chartTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {isLoading
                  ? <div className="h-[220px] rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  : chartData.length === 0
                  ? <div className="h-[220px] flex flex-col items-center justify-center gap-3">
                      <BarChart2 size={32} style={{ color: "rgba(100,116,139,0.25)" }} />
                      <p className="text-sm" style={{ color: "rgba(100,116,139,0.45)" }}>Data will appear as your platform grows</p>
                    </div>
                  : <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ov-rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#635BFF" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#635BFF" stopOpacity={0}    />
                          </linearGradient>
                          <linearGradient id="ov-inv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#38BDF8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="month" stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} />
                        <YAxis hide />
                        <Tooltip content={<ChartTip money={chartTab === "revenue"} />} />
                        {chartTab === "revenue"
                          ? <Area type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2.5} fill="url(#ov-rev)" dot={false} activeDot={{ r: 5, fill: "#A78BFA", strokeWidth: 0 }} />
                          : <Area type="monotone" dataKey="count"   stroke="#38BDF8" strokeWidth={2.5} fill="url(#ov-inv)" dot={false} activeDot={{ r: 5, fill: "#38BDF8", strokeWidth: 0 }} />
                        }
                      </AreaChart>
                    </ResponsiveContainer>
                }
              </motion.div>
            </AnimatePresence>
          </GCard>

          <GCard delay={0.28} className="p-5 flex flex-col">
            <div className="flex p-0.5 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <TabBtn label="Plans"    active={rightTab === "plans"}    onClick={() => setRightTab("plans")}    />
              <TabBtn label="Segments" active={rightTab === "segments"} onClick={() => setRightTab("segments")} />
            </div>
            <AnimatePresence mode="wait">
              {rightTab === "plans" ? (
                <motion.div key="plans" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex-1">
                  <p className="text-[13px] font-bold text-white mb-1">Plan Distribution</p>
                  <p className="text-[11px] mb-4" style={{ color: "rgba(100,116,139,0.6)" }}>{fmtNum(stats && stats.totalUsers)} total users</p>
                  {isLoading
                    ? <div className="flex justify-center"><div className="w-24 h-24 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} /></div>
                    : <PlanDonut plans={stats && stats.plans} />
                  }
                </motion.div>
              ) : (
                <motion.div key="segments" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex-1">
                  <p className="text-[13px] font-bold text-white mb-1">User Segments</p>
                  <p className="text-[11px] mb-4" style={{ color: "rgba(100,116,139,0.6)" }}>By subscription plan</p>
                  {isLoading
                    ? <div className="h-28 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                    : <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={segData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" stroke="transparent" tick={{ fill: "rgba(100,116,139,0.6)", fontSize: 11 }} />
                          <YAxis hide />
                          <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(99,91,255,0.06)" }} />
                          <Bar dataKey="v" radius={[6,6,0,0]} maxBarSize={40}>
                            {segData.map((d,i) => <Cell key={i} fill={d.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </GCard>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <GCard delay={0.34} className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-bold text-white">Recent Activity</p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(100,116,139,0.65)" }}>Latest platform events</p>
              </div>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)", color: "#A78BFA" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(99,91,255,0.1)"}>
                View all <ArrowUpRight size={11} />
              </motion.button>
            </div>
            {isLoading && Array.from({ length: 5 }).map((_,i) => (
              <div key={i} className="flex gap-3 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-7 h-7 rounded-xl animate-pulse shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3 rounded-lg animate-pulse w-3/5" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-2.5 rounded-lg animate-pulse w-2/5" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              </div>
            ))}
            {!isLoading && (!activity || activity.length === 0) && (
              <div className="flex flex-col items-center py-14 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.15)" }}>
                  <Activity size={24} style={{ color: "rgba(99,91,255,0.4)" }} />
                </div>
                <p className="text-sm font-semibold text-white">No activity yet</p>
                <p className="text-xs text-center max-w-[200px]" style={{ color: "rgba(100,116,139,0.5)" }}>Data will appear as your platform grows</p>
              </div>
            )}
            {!isLoading && activity && activity.map((e, i) => <ActivityItem key={i} event={e} i={i} />)}
          </GCard>

          <GCard delay={0.4} className="p-5">
            <p className="text-[14px] font-bold text-white mb-1">Quick Actions</p>
            <p className="text-[12px] mb-5" style={{ color: "rgba(100,116,139,0.65)" }}>Common admin tasks</p>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((a, i) => (
                <QAction key={a.label} icon={a.icon} label={a.label} color={a.color} onClick={a.fn} delay={0.42 + i * 0.05} />
              ))}
            </div>
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "rgba(100,116,139,0.45)" }}>Platform Health</p>
              {["API","Database","AI"].map(s => (
                <div key={s} className="flex items-center justify-between py-1.5">
                  <span className="text-[12px] font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>{s}</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: "#4ADE80" }}>
                    <motion.span animate={{ scale: [1,1.4,1], opacity: [1,0.5,1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80" }} />
                    Operational
                  </span>
                </div>
              ))}
            </div>
          </GCard>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
