import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import * as clientPortalService from "../../services/clientPortalService";

const statusColors = {
  draft: "badge-neutral", sent: "badge-info", viewed: "badge-brand",
  paid: "badge-success", overdue: "badge-error", cancelled: "badge-neutral",
};

const ClientInvoices = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    clientPortalService.getInvoices().then(r => setInvoices(r.data.data.invoices));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Your Invoices</h1>
      {invoices.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <FileText size={40} className="text-slate-600 mb-3" />
          <p className="text-slate-400">No invoices yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-border">
              <tr className="text-left text-ink-secondary">
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-b border-dark-border last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-200">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-200">{inv.currency} {inv.total?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-secondary">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColors[inv.status] || "badge-neutral"}`}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientInvoices;
