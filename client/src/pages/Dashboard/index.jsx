import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, FolderKanban, CheckSquare, Clock, Plus, ArrowRight, AlertCircle } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useDashboardStore from "../../store/dashboardStore";
import StatCard from "../../components/dashboard/StatCard";
import EarningsChart from "../../components/dashboard/EarningsChart";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { SkeletonStat, SkeletonRow } from "../../components/ui/Skeleton";
import { formatDate, formatCurrency } from "../../utils/helpers";

const Dashboard = () => {
  const { user }                    = useAuthStore();
  const { summary, fetchSummary, isLoading } = useDashboardStore();

  useEffect(() => { fetchSummary(); }, []);

  const s = summary?.data || summary;   // handle both wrapped and unwrapped responses

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-slate-100">
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Here&apos;s what&apos;s happening with your work today.
          </p>
        </div>
        <Link to="/projects">
          <Button size="sm" icon={<Plus size={14} />}>New Project</Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={formatCurrency(s?.revenue?.totalRevenue || 0)}
              icon={DollarSign}
              trend={18}
              trendLabel="vs last month"
              color="brand"
              delay={0}
            />
            <StatCard
              label="Active Projects"
              value={s?.projects?.active ?? 0}
              icon={FolderKanban}
              trend={5}
              trendLabel={`${s?.projects?.total ?? 0} total`}
              color="success"
              delay={0.05}
            />
            <StatCard
              label="Tasks Done"
              value={s?.tasks?.done ?? 0}
              icon={CheckSquare}
              trend={12}
              trendLabel={`${s?.tasks?.total ?? 0} total`}
              color="cyan"
              delay={0.1}
            />
            <StatCard
              label="In Progress"
              value={s?.tasks?.in_progress ?? 0}
              icon={Clock}
              trendLabel={`${s?.tasks?.todo ?? 0} todo`}
              color="warning"
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><EarningsChart /></div>
        <ActivityFeed />
      </div>

      {/* Upcoming tasks */}
      {s?.upcomingTasks?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-warning" />
            <h3 className="font-semibold text-ink dark:text-slate-100">Due this week</h3>
          </div>
          <div className="divide-y divide-surface-border dark:divide-dark-border">
            {s.upcomingTasks.map((task) => (
              <div key={task._id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-slate-200 truncate">{task.title}</p>
                  <p className="text-xs text-ink-muted">{task.projectId?.title}</p>
                </div>
                <Badge status={task.priority} />
                <span className="text-xs text-ink-muted shrink-0">{formatDate(task.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink dark:text-slate-100">Recent Projects</h3>
          <Link to="/projects" className="flex items-center gap-1 text-sm text-brand hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-surface-border dark:divide-dark-border">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : !s?.recentProjects?.length ? (
          <div className="text-center py-10">
            <FolderKanban size={36} className="mx-auto text-ink-muted opacity-30 mb-2" />
            <p className="text-sm text-ink-secondary">No projects yet</p>
            <Link to="/projects"><Button size="sm" className="mt-3">Create your first project</Button></Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-border dark:divide-dark-border">
            {s.recentProjects.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 py-3 -mx-2 px-2 rounded-lg table-row-hover">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand/10 flex items-center justify-center shrink-0">
                  <FolderKanban size={14} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/projects/${p._id}`}
                    className="text-sm font-medium text-ink dark:text-slate-200 hover:text-brand transition-colors truncate block">
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 bg-surface-border dark:bg-dark-border rounded-full overflow-hidden max-w-[80px]">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-ink-muted">{p.progress}%</span>
                  </div>
                </div>
                <span className="text-sm text-ink-secondary hidden sm:block">
                  {formatCurrency(p.budget, p.currency)}
                </span>
                <Badge status={p.status} dot />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
