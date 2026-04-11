import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, CreditCard, TrendingUp, Clock, CheckCircle, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import useInvoiceStore from "../../store/invoiceStore";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import { SkeletonRow, SkeletonStat } from "../../components/ui/Skeleton";
import { formatDate, formatCurrency } from "../../utils/helpers";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import useThemeStore from "../../store/themeStore";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const Payments = () => {
  const { invoices, analytics, outstanding, fetchInvoices, fetchAnalytics, isLoading } = useInvoiceStore();
  const { isDark } = useThemeStore();
  const [tab, setTab] = useState("invoices");

  useEffect(() => {
    fetchInvoices();
    fetchAnalytics();
  }, []);

  const chartData = (analytics || []).map((d) => ({
    month: MONTH_NAMES[(d.month || 1) - 1],
    revenue: d.revenue,
  }));

  const totalRevenue = (analytics || []).reduce((s, d) => s + d.revenue, 0);
  const gridColor    = isDark ? "#1E2A3B" : "#E3E8EF";
  const textColor    = isDark ? "#6B7280" : "#9CA3AF";

  const TABS = [
    { id: "invoices",  label: "Invoices",  icon: FileText,   count: invoices.length },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-slate-100">Payments</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Track income and invoices</p>
        </div>
        <Link to="/payments/new">
          <Button icon={<Plus size={15} />}>New Invoice</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />) : (
          <>
            {[
              { icon: TrendingUp,   label: "Total Revenue",  value: formatCurrency(totalRevenue),                  color: "bg-brand-50 dark:bg-brand/10 text-brand" },
              { icon: Clock,        label: "Outstanding",    value: formatCurrency(outstanding?.outstanding ?? 0), color: "bg-amber-50 dark:bg-amber-900/20 text-warning" },
              { icon: CheckCircle,  label: "Paid Invoices",  value: invoices.filter((i) => i.status === "paid").length, color: "bg-emerald-50 dark:bg-emerald-900/20 text-success" },
              { icon: FileText,     label: "Overdue",        value: invoices.filter((i) => i.status === "overdue").length, color: "bg-red-50 dark:bg-red-900/20 text-error" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={16} />
                </div>
                <p className="text-xl font-bold text-ink dark:text-slate-100">{value}</p>
                <p className="text-sm text-ink-secondary">{label}</p>
              </div>
            ))}
          </>
        )}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6 w-fit" />

      {tab === "invoices" && (
        <div className="card">
          <div className="divide-y divide-surface-border dark:divide-dark-border">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) :
              invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={36} className="mx-auto text-ink-muted opacity-30 mb-2" />
                  <p className="text-sm text-ink-secondary">No invoices yet</p>
                  <Link to="/payments/new"><Button size="sm" className="mt-3">Create invoice</Button></Link>
                </div>
              ) : invoices.map((inv, i) => (
                <motion.div key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 py-3 table-row-hover -mx-2 px-2 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand/10 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/payments/${inv._id}`} className="text-sm font-medium text-ink dark:text-slate-200 hover:text-brand transition-colors">
                      {inv.invoiceNumber}
                    </Link>
                    <p className="text-xs text-ink-muted">{inv.clientId?.name} · Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <Badge status={inv.status} dot />
                  <span className="text-sm font-semibold text-ink dark:text-slate-200 hidden sm:block">
                    {formatCurrency(inv.total, inv.currency)}
                  </span>
                </motion.div>
              ))
            }
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-ink dark:text-slate-100">Revenue over time</h3>
              <p className="text-sm text-ink-secondary mt-0.5">Monthly paid invoices</p>
            </div>
            <p className="text-2xl font-bold text-ink dark:text-slate-100">{formatCurrency(totalRevenue)}</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#635BFF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#635BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: textColor }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(v), "Revenue"]}
                contentStyle={{ borderRadius: 10, fontSize: 13, border: "1px solid #E3E8EF" }} />
              <Area type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2}
                fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#635BFF", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Payments;
