import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Search, Mail, Building2, Phone, Trash2, Pencil, TrendingUp } from "lucide-react";
import useClientStore from "../../store/clientStore";
import useDebounce from "../../hooks/useDebounce";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { getInitials, formatCurrency } from "../../utils/helpers";

const ClientForm = ({ initial = {}, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "", address: "", notes: "", ...initial,
  });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full name *" name="name" placeholder="Jane Doe" value={form.name} onChange={set} required />
        <Input label="Email *" name="email" type="email" placeholder="jane@acme.com" value={form.email} onChange={set} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Company" name="company" placeholder="Acme Corp" value={form.company} onChange={set} />
        <Input label="Phone" name="phone" placeholder="+1 555 000 0000" value={form.phone} onChange={set} />
      </div>
      <Input label="Address" name="address" placeholder="123 Main St, City" value={form.address} onChange={set} />
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" className="input resize-none h-20" placeholder="Any notes about this client..." value={form.notes} onChange={set} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>{initial._id ? "Save changes" : "Add client"}</Button>
      </div>
    </form>
  );
};

const ClientCard = ({ client, onEdit, onDelete }) => (
  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className="card-hover group">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-sm font-bold shrink-0">
          {getInitials(client.name)}
        </div>
        <div>
          <Link to={`/clients/${client._id}`} className="font-semibold text-ink dark:text-slate-100 hover:text-brand transition-colors">
            {client.name}
          </Link>
          {client.company && <p className="text-xs text-ink-muted">{client.company}</p>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(client)} className="p-1.5 rounded-lg hover:bg-surface-secondary dark:hover:bg-dark-muted text-ink-muted hover:text-brand transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(client._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-error transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>

    <div className="space-y-1.5 mb-4">
      <div className="flex items-center gap-2 text-xs text-ink-secondary">
        <Mail size={11} className="shrink-0" />
        <span className="truncate">{client.email}</span>
      </div>
      {client.phone && (
        <div className="flex items-center gap-2 text-xs text-ink-secondary">
          <Phone size={11} className="shrink-0" />
          <span>{client.phone}</span>
        </div>
      )}
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-surface-border dark:border-dark-border">
      <div className="text-center">
        <p className="text-sm font-semibold text-ink dark:text-slate-200">{client.stats?.totalProjects ?? 0}</p>
        <p className="text-2xs text-ink-muted">Projects</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-ink dark:text-slate-200">{formatCurrency(client.stats?.totalPaid ?? 0)}</p>
        <p className="text-2xs text-ink-muted">Paid</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-ink dark:text-slate-200">{formatCurrency(client.stats?.totalInvoiced ?? 0)}</p>
        <p className="text-2xs text-ink-muted">Invoiced</p>
      </div>
    </div>
  </motion.div>
);

const Clients = () => {
  const { clients, fetchClients, createClient, updateClient, deleteClient, isLoading } = useClientStore();
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null); // null | "create" | client object
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch         = useDebounce(search);

  useEffect(() => { fetchClients({ search: debouncedSearch }); }, [debouncedSearch]);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (modal?._id) await updateClient(modal._id, form);
      else await createClient(form);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteClient(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-slate-100">Clients</h1>
          <p className="text-sm text-ink-secondary mt-0.5">{clients.length} total</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setModal("create")}>Add Client</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input className="input pl-8" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Add your first client to start tracking projects and invoices."
          action={() => setModal("create")} actionLabel="Add Client" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {clients.map((c) => (
              <ClientCard key={c._id} client={c}
                onEdit={(client) => setModal(client)}
                onDelete={(id) => setDeleteId(id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?._id ? "Edit Client" : "New Client"}
        description={modal?._id ? "Update client information" : "Add a new client to your workspace"}>
        <ClientForm
          initial={modal?._id ? modal : {}}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog open={!!deleteId}
        title="Delete client"
        message="This will permanently delete the client. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default Clients;
