import { useEffect, useState } from "react";
import { FileText, FolderOpen, DollarSign } from "lucide-react";
import * as clientPortalService from "../../services/clientPortalService";

const ClientDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    clientPortalService.getInvoices().then(r => setInvoices(r.data.data.invoices));
    clientPortalService.getProjects().then(r => setProjects(r.data.data.projects));
  }, []);

  const outstanding = invoices.filter(i => ["sent","overdue"].includes(i.status));
  const totalOwed   = outstanding.reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Your Overview</h1>
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
            <FileText size={18} className="text-brand" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{invoices.length}</p>
            <p className="text-sm text-ink-secondary">Total Invoices</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <DollarSign size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">₹{totalOwed.toLocaleString()}</p>
            <p className="text-sm text-ink-secondary">Outstanding</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
            <FolderOpen size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{projects.length}</p>
            <p className="text-sm text-ink-secondary">Active Projects</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
