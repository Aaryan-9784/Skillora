import { motion } from "framer-motion";
import { FolderKanban, CheckSquare, FileText, UserPlus, CreditCard, Sparkles, Clock } from "lucide-react";
import useDashboardStore from "../../store/dashboardStore";
import useClientStore from "../../store/clientStore";
import useInvoiceStore from "../../store/invoiceStore";
import { relativeTime, formatCurrency } from "../../utils/helpers";

const ActivityFeed = () => {
  const { summary } = useDashboardStore();
  const { clients } = useClientStore();
  const { invoices } = useInvoiceStore();
  const s = summary?.data || summary;

  const realActivities = [];

  // 1. Real Database Projects Activity
  (s?.recentProjects || []).forEach((p) => {
    realActivities.push({
      id: `proj-${p._id}`,
      icon: FolderKanban,
      text: `Project: ${p.title}`,
      time: relativeTime(p.updatedAt || p.createdAt),
      rawTime: new Date(p.updatedAt || p.createdAt).getTime(),
      color: "#635BFF",
      bg: "rgba(99,91,255,0.15)",
      group: "Recent Projects",
    });
  });

  // 2. Real Database Tasks Activity
  (s?.upcomingTasks || []).forEach((t) => {
    realActivities.push({
      id: `task-${t._id}`,
      icon: CheckSquare,
      text: `Task: ${t.title}`,
      time: relativeTime(t.updatedAt || t.createdAt),
      rawTime: new Date(t.updatedAt || t.createdAt).getTime(),
      color: t.status === "done" ? "#22C55E" : "#00D4FF",
      bg: t.status === "done" ? "rgba(34,197,94,0.15)" : "rgba(0,212,255,0.15)",
      group: "Due Tasks",
    });
  });

  // 3. Real Database Invoices Activity
  (invoices || []).slice(0, 5).forEach((inv) => {
    realActivities.push({
      id: `inv-${inv._id}`,
      icon: inv.status === "paid" ? CreditCard : FileText,
      text: `Invoice #${inv.number || inv.invoiceNumber || "INV"}: ${formatCurrency(inv.total || 0)}`,
      time: relativeTime(inv.updatedAt || inv.createdAt),
      rawTime: new Date(inv.updatedAt || inv.createdAt).getTime(),
      color: inv.status === "paid" ? "#22C55E" : "#F59E0B",
      bg: inv.status === "paid" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
      group: "Invoices",
    });
  });

  // 4. Real Database Clients Activity
  (clients || []).slice(0, 5).forEach((c) => {
    realActivities.push({
      id: `client-${c._id}`,
      icon: UserPlus,
      text: `Client: ${c.name || c.company}`,
      time: relativeTime(c.updatedAt || c.createdAt),
      rawTime: new Date(c.updatedAt || c.createdAt).getTime(),
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.15)",
      group: "Clients",
    });
  });

  // Sort by raw time descending
  realActivities.sort((a, b) => b.rawTime - a.rawTime);

  const groups = [...new Set(realActivities.map((a) => a.group))];

  return (
    <div
      className="relative rounded-2xl flex flex-col"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h3 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>Recent Activity</h3>
        <div className="relative w-2.5 h-2.5">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "#22C55E" }}
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-0 rounded-full"
            style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }} />
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 [scrollbar-width:none] [-ms-overflow-style:none]">
        {realActivities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 my-auto">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-2 border border-white/5">
              <Clock size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-300">No recent activity yet</p>
            <p className="text-[11px] text-slate-500 max-w-[180px] mt-1">
              Create a project, task, or invoice to track live workspace events.
            </p>
          </div>
        ) : (
          groups.map((group, gi) => (
            <div key={group}>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mt-3 mb-1">
                {group}
              </p>

              {realActivities.filter((a) => a.group === group).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 -mx-2 transition-colors hover:bg-white/[0.04] cursor-default"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                    <item.icon size={13} style={{ color: item.color }} />
                  </div>
                  <p className="flex-1 min-w-0 text-xs leading-snug truncate text-slate-300 font-medium">
                    {item.text}
                  </p>
                  <span className="text-[10px] shrink-0 text-slate-500 font-medium">
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
