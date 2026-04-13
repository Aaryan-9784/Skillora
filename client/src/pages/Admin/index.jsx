import { useEffect } from "react";
import { Users, TrendingUp, CreditCard, Activity } from "lucide-react";
import useAdminStore from "../../store/adminStore";

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      <p className="text-sm text-ink-secondary">{label}</p>
    </div>
  </div>
);

const AdminOverview = () => {
  const { stats, fetchStats, isLoading } = useAdminStore();
  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Platform Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Users"  value={stats?.totalUsers}  icon={Users}      color="#635BFF" />
        <StatCard label="Active Today" value={stats?.activeToday} icon={Activity}   color="#10B981" />
        <StatCard label="Pro/Premium"  value={stats?.paidUsers}   icon={CreditCard} color="#00D4FF" />
        <StatCard label="MRR (₹)"      value={stats?.mrr}         icon={TrendingUp} color="#F59E0B" />
      </div>
    </div>
  );
};

export default AdminOverview;
