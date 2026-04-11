import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

export const SparklineChart = ({ data = [], color = "#635BFF" }) => {
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ height: 40, marginLeft: -4, marginRight: -4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {payload[0].value?.toLocaleString()}
                </div>
              ) : null
            }
            cursor={false}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace("#","")})`}
            dot={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
