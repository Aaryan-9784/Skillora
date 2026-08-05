import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, TrendingUp, CreditCard, DollarSign,
  RefreshCw, BarChart2, Activity, UserPlus,
  CheckCircle, ArrowUpRight, UserCheck,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import useAdminStore from "../../store/adminStore";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PLAN_COLORS = { free: "#64748B", pro: "#818CF8", premium: "#F59E0B" };

const fmt = n => {
  if (n == null) return "—";
  if (n >= 1000000) return "₹" + (n/1000000).toFixed(1) + "M";
  if (n >= 1000)    return "₹" + (n/1000).toFixed(1) + "K";
  return "₹" + n;
};
const fmtNum = n => n == null ? "—" : Number(n).toLocaleString();

// ── Sparkline ──────────────────────────────────────────────────────────────
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

// ── Chart Tooltip ──────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label, money }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: "rgba(6,9,22,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <p className="mb-1 font-semibold" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill || "#635BFF" }} />
          <span className="font-bold text-white">{money ? fmt(p.value) : fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Glass Container Card ───────────────────────────────────────────────────
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

// ── KPI Card Component ─────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, sub, color, spark, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16,1,0.3,1] }}
    whileHover={{ y: -4, transition: { duration: 0.18 } }}
    className="relative overflow-hidden rounded-2xl p-5 cursor-default group"
    style={{
      background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)",
      border: "1px solid " + color + "20", backdropFilter: "blur(16px)",
    }}
  >
    <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none transition-all duration-500 group-hover:scale-150 opacity-60"
      style={{ background: "radial-gradient(circle," + color + "20 0%,transparent 70%)" }} />
    <div className="absolute inset-x-0 top-0 h-px"
      style={{ background: "linear-gradient(90deg,transparent," + color + "50,transparent)" }} />

    <div className="flex items-center justify-between mb-3">
      <span className="text-[12px] font-semibold" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</span>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: color + "16", border: "1px solid " + color + "30", boxShadow: "0 0 16px " + color + "18" }}>
        <Icon size={17} style={{ color }} />
      </div>
    </div>

    <p className="text-[28px] font-black text-white tracking-tight leading-none mb-1.5">{value}</p>
    {sub && <p className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.55)" }}>{sub}</p>}
    {spark && spark.length > 1 && <div className="mt-2"><Spark data={spark} color={color} /></div>}
  </motion.div>
);

// ── Plan Donut Chart ───────────────────────────────────────────────────────
const PlanDonut = ({ plans }) => {
  const p = plans || {};
  const data = [
    { name: "Free",    value: p.free    || 0, color: PLAN_COLORS.free    },
    { name: "Pro",     value: p.pro     || 0, color: PLAN_COLORS.pro     },
    { name: "Premium", value: p.premium || 0, color: PLAN_COLORS.premium },
  ].filter(d => d.value > 0);
  const total = data.reduce((s,d) => s + d.value, 0);

  if (!total) return (
    <div className="flex flex-col items-center justify-center h-36 gap-2">
      <BarChart2 size={24} style={{ color: "rgba(100,116,139,0.3)" }} />
      <p className="text-xs" style={{ color: "rgba(100,116,139,0.45)" }}>No plan data registered</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center pt-2">
        <PieChart width={120} height={120}>
          <Pie data={data} cx={60} cy={60} innerRadius={36} outerRadius={56}
            dataKey="value" strokeWidth={0} paddingAngle={4}>
            {data.map((d,i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </div>

      <div className="space-y-3">
        {data.map(d => (
          <div key={d.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="font-semibold" style={{ color: "rgba(148,163,184,0.85)" }}>{d.name} Tier</span>
              </div>
              <span className="font-bold text-white">{Math.round((d.value/total)*100)}% ({d.value})</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: (d.value/total*100) + "%" }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full" style={{ background: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Activity Row Item ──────────────────────────────────────────────────────
const ActivityItem = ({ event, i }) => {
  const isJoin = event.type === "user_joined";
  const color  = isJoin ? "#38BDF8" : "#10B981";
  const Icon   = isJoin ? UserPlus : CheckCircle;
  const label  = isJoin
    ? (event.name + " joined as " + (event.role || "user"))
    : ("Invoice #" + event.invoiceNumber + " paid — " + fmt(event.amount));
  const sub  = isJoin ? event.email : event.ownerName;
  const time = event.at ? new Date(event.at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "";

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04, duration: 0.3 }}
      className="flex items-center gap-3.5 py-3.5 border-b border-white/[0.04] last:border-0 group">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "14", border: "1px solid " + color + "28" }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white truncate group-hover:text-purple-300 transition-colors">{label}</p>
        <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(148,163,184,0.6)" }}>{sub}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-[11px]" style={{ color: "rgba(100,116,139,0.6)" }}>{time}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: color + "14", color, border: "1px solid " + color + "22" }}>
          {isJoin ? "Signup" : "Payment"}
        </span>
      </div>
    </motion.div>
  );
};

// ── Tab Button Helper ──────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className="px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all duration-200 cursor-pointer"
    style={{
      background: active ? "rgba(99,91,255,0.22)" : "transparent",
      color: active ? "#A78BFA" : "rgba(100,116,139,0.65)",
      boxShadow: active ? "0 0 12px rgba(99,91,255,0.2)" : "none",
    }}>
    {label}
  </button>
);

// ── MAIN ADMIN OVERVIEW COMPONENT ──────────────────────────────────────────
const AdminOverview = () => {
  const navigate = useNavigate();
  const { stats, revenue, activity, isLoading, fetchStats, fetchRevenue, fetchActivity } = useAdminStore();
  const [chartTab, setChartTab] = useState("revenue");
  const [period, setPeriod]     = useState(6);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRevenue(period);
    fetchActivity({ limit: 8 });

    const handleSync = () => {
      fetchStats();
      fetchRevenue(period);
      fetchActivity({ limit: 8 });
    };
    window.addEventListener("admin:stats_refresh", handleSync);
    return () => window.removeEventListener("admin:stats_refresh", handleSync);
  }, [period]);

  const handleRefresh = async () => {
    setSpinning(true);
    await Promise.all([fetchStats(), fetchRevenue(period), fetchActivity({ limit: 8 })]);
    setSpinning(false);
  };

  const chartData = (revenue || []).map(r => ({
    month: MONTHS[(r.month || 1) - 1], revenue: r.revenue || 0, count: r.count || 0,
  }));
  const revSpark = chartData.slice(-6).map(d => ({ v: d.revenue }));

  // 4 Core Important KPI Cards
  const kpis = [
    {
      icon: Users,
      label: "Total Users",
      value: fmtNum(stats?.totalUsers),
      sub: "+" + fmtNum(stats?.newUsers) + " new this month",
      color: "#635BFF",
      delay: 0,
    },
    {
      icon: UserCheck,
      label: "Active Users (30d)",
      value: fmtNum(stats?.activeToday),
      sub: "Active platform accounts",
      color: "#10B981",
      delay: 0.07,
    },
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: fmt(stats?.mrr),
      sub: "All-time paid invoices",
      color: "#F59E0B",
      spark: revSpark,
      delay: 0.14,
    },
    {
      icon: CreditCard,
      label: "Paid Subscribers",
      value: fmtNum(stats?.paidUsers),
      sub: "Pro & Premium tiers",
      color: "#00D4FF",
      delay: 0.21,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{ background: "linear-gradient(135deg,#FFFFFF 30%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Platform Overview
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Key metrics and real-time activity across your platform
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRefresh}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(148,163,184,0.75)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.12)"; e.currentTarget.style.color = "#A78BFA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.75)"; }}>
              <motion.span animate={{ rotate: spinning ? 360 : 0 }}
                transition={{ duration: 0.6, ease: "linear", repeat: spinning ? Infinity : 0 }}>
                <RefreshCw size={15} />
              </motion.span>
            </motion.button>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/admin/users")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)", boxShadow: "0 0 20px rgba(99,91,255,0.3)" }}>
              <Users size={14} /> Manage Users
            </motion.button>
          </div>
        </motion.div>

        {/* ── 4 CORE KPI CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_,i) => (
                <div key={i} className="rounded-2xl p-5 animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", minHeight: 120 }} />
              ))
            : kpis.map(k => <KPICard key={k.label} {...k} />)
          }
        </div>

        {/* ── CHARTS & BREAKDOWN ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Analytics Area Chart */}
          <GCard delay={0.2} className="lg:col-span-2 p-6" glow="#635BFF">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-base font-bold text-white">Analytics Overview</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.65)" }}>
                  Historical trend for last {period} months
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Time range selector */}
                <div className="flex p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {[3,6,12].map(m => (
                    <button key={m} onClick={() => setPeriod(m)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
                      style={{
                        background: period === m ? "rgba(99,91,255,0.25)" : "transparent",
                        color: period === m ? "#A78BFA" : "rgba(100,116,139,0.65)"
                      }}>
                      {m}m
                    </button>
                  ))}
                </div>

                {/* Metric tab toggle */}
                <div className="flex p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <TabBtn label="Revenue"  active={chartTab === "revenue"}  onClick={() => setChartTab("revenue")}  />
                  <TabBtn label="Invoices" active={chartTab === "invoices"} onClick={() => setChartTab("invoices")} />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={chartTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {isLoading
                  ? <div className="h-[240px] rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  : chartData.length === 0
                  ? <div className="h-[240px] flex flex-col items-center justify-center gap-3">
                      <BarChart2 size={32} style={{ color: "rgba(100,116,139,0.25)" }} />
                      <p className="text-sm font-medium" style={{ color: "rgba(100,116,139,0.5)" }}>Analytics data will populate as activity grows</p>
                    </div>
                  : <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
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
                        <XAxis dataKey="month" stroke="transparent" tick={{ fill: "rgba(148,163,184,0.6)", fontSize: 11 }} />
                        <YAxis stroke="transparent" tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 11 }} />
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

          {/* Subscription Tier Distribution */}
          <GCard delay={0.28} className="p-6 flex flex-col justify-between">
            <div>
              <p className="text-base font-bold text-white mb-1">Plan Distribution</p>
              <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.65)" }}>
                User breakdown by subscription tier
              </p>
              {isLoading
                ? <div className="flex justify-center py-6"><div className="w-24 h-24 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} /></div>
                : <PlanDonut plans={stats?.plans} />
              }
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-400">
              <span>Total Users</span>
              <span className="font-bold text-white">{fmtNum(stats?.totalUsers)}</span>
            </div>
          </GCard>
        </div>

        {/* ── RECENT ACTIVITY ROW ── */}
        <div>
          {/* Recent Platform Activity */}
          <GCard delay={0.34} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold text-white">Recent Activity</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.65)" }}>Latest platform signups & payments</p>
              </div>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)", color: "#A78BFA" }}>
                View Users <ArrowUpRight size={12} />
              </motion.button>
            </div>

            {isLoading && Array.from({ length: 4 }).map((_,i) => (
              <div key={i} className="flex gap-3 py-3.5 border-b border-white/[0.04]">
                <div className="w-8 h-8 rounded-xl animate-pulse shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3 rounded-lg animate-pulse w-3/5" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-2.5 rounded-lg animate-pulse w-2/5" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              </div>
            ))}

            {!isLoading && (!activity || activity.length === 0) && (
              <div className="flex flex-col items-center py-12 gap-2 text-center">
                <Activity size={24} style={{ color: "rgba(148,163,184,0.3)" }} />
                <p className="text-sm font-semibold text-white">No recent activity</p>
                <p className="text-xs text-gray-400">Events will appear here as users sign up and pay</p>
              </div>
            )}

            {!isLoading && activity && activity.map((e, i) => <ActivityItem key={i} event={e} i={i} />)}
          </GCard>
        </div>

      </div>
    </div>
  );
};

export default AdminOverview;
