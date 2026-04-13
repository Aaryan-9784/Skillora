import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Building2, MapPin, FolderKanban, FileText, Send } from "lucide-react";
import useClientStore from "../../store/clientStore";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import Spinner from "../../components/common/Spinner";
import { formatDate, formatCurrency, getInitials } from "../../utils/helpers";
import api from "../../services/api";
import toast from "react-hot-toast";

const ClientDetail = () => {
  const { id } = useParams();
  const { current, fetchClient, isLoading } = useClientStore();
  const [inviting, setInviting] = useState(false);

  useEffect(() => { fetchClient(id); }, [id]);

  if (isLoading || !current) return <Spinner size="lg" className="min-h-[60vh]" />;

  const { client, projects = [], invoices = [] } = current;

  const handleInvite = async () => {
    setInviting(true);
    try {
      await api.post(`/clients/${id}/invite`);
      toast.success(`Portal invite sent to ${client.email}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send invite";
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/clients" className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to clients
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-xl font-bold mb-3">
              {getInitials(client.name)}
            </div>
            <h2 className="text-lg font-bold text-ink dark:text-slate-100">{client.name}</h2>
            {client.company && <p className="text-sm text-ink-secondary">{client.company}</p>}
          </div>

          <div className="space-y-3">
            {[
              { icon: Mail,      value: client.email },
              { icon: Phone,     value: client.phone },
              { icon: Building2, value: client.company },
              { icon: MapPin,    value: client.address },
            ].filter((r) => r.value).map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-center gap-2.5 text-sm text-ink-secondary">
                <Icon size={14} className="text-ink-muted shrink-0" />
                <span className="truncate">{value}</span>
              </div>
            ))}
          </div>

          {client.notes && (
            <div className="mt-4 pt-4 border-t border-surface-border dark:border-dark-border">
              <p className="text-xs font-medium text-ink-muted mb-1">Notes</p>
              <p className="text-sm text-ink-secondary">{client.notes}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-surface-border dark:border-dark-border grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Projects",  value: client.stats?.totalProjects ?? 0 },
              { label: "Invoiced",  value: formatCurrency(client.stats?.totalInvoiced ?? 0) },
              { label: "Paid",      value: formatCurrency(client.stats?.totalPaid ?? 0) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-sm font-bold text-ink dark:text-slate-100">{value}</p>
                <p className="text-2xs text-ink-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Invite to Portal button */}
          <div className="mt-4 pt-4 border-t border-surface-border dark:border-dark-border">
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
                boxShadow: "0 0 16px rgba(99,91,255,0.3)",
                opacity: inviting ? 0.7 : 1,
              }}
            >
              <Send size={14} />
              {inviting ? "Sending invite…" : "Invite to Client Portal"}
            </button>
            <p className="text-xs text-ink-muted text-center mt-2">
              Sends a portal access link to {client.email}
            </p>
          </div>
        </motion.div>

        {/* Projects + Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink dark:text-slate-100 flex items-center gap-2">
                <FolderKanban size={16} className="text-brand" /> Projects
              </h3>
              <span className="badge-neutral">{projects.length}</span>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-6">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <Link key={p._id} to={`/projects/${p._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary dark:hover:bg-dark-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-slate-200 truncate">{p.title}</p>
                      <ProgressBar value={p.progress} size="sm" className="mt-1.5 max-w-[120px]" />
                    </div>
                    <div className="text-right shrink-0">
                      <Badge status={p.status} />
                      <p className="text-xs text-ink-muted mt-1">{formatDate(p.deadline)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Invoices */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink dark:text-slate-100 flex items-center gap-2">
                <FileText size={16} className="text-brand" /> Invoices
              </h3>
              <span className="badge-neutral">{invoices.length}</span>
            </div>
            {invoices.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-6">No invoices yet</p>
            ) : (
              <div className="divide-y divide-surface-border dark:divide-dark-border">
                {invoices.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-ink dark:text-slate-200">{inv.invoiceNumber}</p>
                      <p className="text-xs text-ink-muted">Due {formatDate(inv.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink dark:text-slate-200">{formatCurrency(inv.total)}</p>
                      <Badge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
