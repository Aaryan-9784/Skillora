import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const ALL_DATA = {
  "7d": [
    { label: "Mon", revenue: 1200, expenses: 400 },
    { label: "Tue", revenue: 1800, expenses: 600 },
    { label: "Wed", revenue: 1400, expenses: 500 },
    { label: "Thu", revenue: 2200, expenses: 700 },
    { label: "Fri", revenue: 1900, expenses: 550 },
    { label: "Sat", revenue: 2600, expenses: 800 },
    { label: "Sun", revenue: 2100, expenses: 650 },
  ],
  "30d": [
    { label: "W1", revenue: 6200, expenses: 2100 },
    { label: "W2", revenue: 7800, expenses: 2600 },
    { label: "W3", revenue: 7100, expenses: 2400 },
    { label: "W4", revenue: 9200, expenses: 3100 },
  ],
  "6m": [
    { label: "Aug", revenue: 18000, expenses: 6000 },
    { label: "Sep", revenue: 21000, expenses: 7200 },
    { label: "Oct", revenue: 19500, expenses: 6800 },
    { label: "Nov", revenue: 24000, expenses: 8100 },
    { label: "Dec", revenue: 22000, expenses: 7500 },
    { label: "Jan", revenue: 28000, expenses: 9200 },
  ],
  "1y": [
    { label: "Feb", revenue: 14000, expenses: 5000 },
    { label: "Mar", revenue: 16000, expenses: 5500 },
    { label: "Apr", revenue: 15000, expenses: 5200 },
    { label: "May", revenue: 18000, expenses: 6100 },
    { label: "Jun", revenue: 17000, expenses: 5800 },
    { label: "Jul", revenue: 20000, expenses: 6800 },
    { label: "Aug", revenue: 19000, expenses: 6500 },
    { label: "Sep", revenue: 22000, expenses: 7400 },
    { label: "Oct", revenue: 21000, expenses: 7100 },
    { label: "Nov", revenue: 25000, expenses: 8400 },
    { label: "Dec", revenue: 24000, expenses: 8100 },
    { label: "Jan", revenue: 29000, expenses: 9600 },
  ],
};

const FILTERS = ["7d", "30d", "6m", "1y"];
const METRICS = ["Revenue", "Expenses", "Profit"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-sm"
      style={{
        background: "rgba(10,17,32,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
      }}>
      <p className="text-xs mb-1.5 font-medium" style={{ color: "#9CA3AF" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="font-semibold" style={{ color: "#F9FAFB" }}>
            ${p.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const EarningsChart = () => {
  const [period, setPeriod]   = useState("6m");
  const [metric, setMetric]   = useState("Revenue");
  const data = ALL_DATA[period] || ALL_DATA["6m"];

  const total   = data.reduce((s, d) => s + (d.revenue || 0), 0);
  const dataKey = metric === "Revenue" ? "revenue" : metric === "Expenses" ? "expenses" : "revenue";
  const lineColor = metric === "Expenses" ? "#F59E0B" : "#635BFF";
  const glowColor = metric === "Expenses" ? "rgba(245,158,11,0.3)" : "rgba(99,91,255,0.3)";

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}>
      {/* Ambient glow */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)` }} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>Revenue Analytics</h3>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
            {period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : period === "6m" ? "Last 6 months" : "Last 12 months"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div>
            <p className="text-2xl font-bold text-right" style={{ color: "#F9FAFB" }}>
              ${total.toLocaleString()}
            </p>
            <p className="text-xs text-right flex items-center justify-end gap-1" style={{ color: "#22C55E" }}>
              <span>↑ 18%</span>
              <span style={{ color: "#6B7280" }}>vs last period</span>
            </p>
          </div>

          {/* Metric toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {METRICS.map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  background: metric === m ? "rgba(99,91,255,0.25)" : "transparent",
                  color: metric === m ? "#A78BFA" : "#6B7280",
                  border: metric === m ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
                }}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-1 mb-4">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setPeriod(f)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150"
            style={{
              background: period === f ? "rgba(99,91,255,0.2)" : "transparent",
              color: period === f ? "#A78BFA" : "#6B7280",
              border: period === f ? "1px solid rgba(99,91,255,0.3)" : "1px solid transparent",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        key={`${period}-${metric}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label"
              tick={{ fontSize: 11, fill: "#4B5563" }}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#4B5563" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip content={<CustomTooltip />}
              cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 }} />
            <Area type="monotone" dataKey={dataKey}
              stroke={lineColor} strokeWidth={2}
              fill="url(#chartGrad)"
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0, filter: `drop-shadow(0 0 6px ${lineColor})` }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default EarningsChart;
