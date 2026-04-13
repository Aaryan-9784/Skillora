import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useAdminStore from "../../store/adminStore";

const AdminRevenue = () => {
  const { revenue, fetchRevenue } = useAdminStore();
  const [months, setMonths] = useState(12);

  useEffect(() => { fetchRevenue(months); }, [months]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="input w-36">
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>
      <div className="card">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#635BFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#635BFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#161D2E", border: "1px solid #1E2A3B", borderRadius: 8 }} />
            <Area type="monotone" dataKey="revenue" stroke="#635BFF" fill="url(#rev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminRevenue;
