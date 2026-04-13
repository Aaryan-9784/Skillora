import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Send, Copy, CheckCircle, XCircle,
} from "lucide-react";
import useInvoiceStore from "../../store/invoiceStore";
import { formatDate, formatCurrency } from "../../utils/helpers";

const STATUS_ACTIONS = {
  draft:     [{ label: "Send Invoice", action: "send",   icon: Send,         color: "#635BFF" }],
  sent:      [{ label: "Mark Paid",    action: "paid",   icon: CheckCircle,  color: "#22C55E" },
              { label: "Cancel",       action: "cancel", icon: XCircle,      color: "#EF4444" }],
  viewed:    [{ label: "Mark Paid",    action: "paid",   icon: CheckCircle,  color: "#22C55E" },
              { label: "Cancel",       action: "cancel", icon: XCircle,      color: "#EF4444" }],
  overdue:   [{ label: "Mark Paid",    action: "paid",   icon: CheckCircle,  color: "#22C55E" }],
  paid:      [],
  cancelled: [],
};

const InvoiceDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { fetchInvoice, updateStatus, sendInvoice, duplicateInvoice, current } = useInvoiceStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchInvoice(id); }, [id]);

  const inv = current;
  if (!inv) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === "send")   await sendInvoice(id);
      else if (action === "paid")   await updateStatus(id, "paid");
      else if (action === "cancel") await updateStatus(id, "cancelled");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    const newInv = await duplicateInvoice(id);
    navigate(`/payments/${newInv._id}`);
  };

  const actions = STATUS_ACTIONS[inv.status] || [];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/payments")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Payments
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:border-white/20 transition-colors">
              <Copy size={13} /> Duplicate
            </button>
            {actions.map((a) => (
              <motion.button key={a.action}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => handleAction(a.action)}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: a.color, boxShadow: `0 0 16px ${a.color}50` }}>
                <a.icon size={13} /> {a.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Invoice card */}
        <div className="rounded-2xl p-8 space-y-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Invoice header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{inv.invoiceNumber}</h1>
              <p className="text-sm text-slate-400 mt-1">
                Issued {formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
              ${inv.status === "paid" ? "bg-green-500/15 text-green-400" :
                inv.status === "overdue" ? "bg-red-500/15 text-red-400" :
                "bg-brand/15 text-brand"}`}>
              {inv.status}
            </span>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">From</p>
              <p className="font-semibold text-white">{inv.owner?.name}</p>
              <p className="text-sm text-slate-400">{inv.owner?.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">To</p>
              <p className="font-semibold text-white">{inv.clientId?.name}</p>
              <p className="text-sm text-slate-400">{inv.clientId?.email}</p>
              {inv.clientId?.company && <p className="text-sm text-slate-400">{inv.clientId.company}</p>}
            </div>
          </div>

          {/* Line items */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-white/10">
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Rate</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inv.lineItems?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-slate-200">{item.description}</td>
                    <td className="py-3 text-center text-slate-400">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-400">{formatCurrency(item.rate, inv.currency)}</td>
                    <td className="py-3 text-right font-semibold text-white">{formatCurrency(item.amount, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span><span>{formatCurrency(inv.subtotal, inv.currency)}</span>
              </div>
              {inv.taxRate > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({inv.taxRate}%)</span><span>{formatCurrency(inv.taxAmount, inv.currency)}</span>
                </div>
              )}
              {inv.discount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Discount</span><span>-{formatCurrency(inv.discount, inv.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-white/10">
                <span>Total</span><span>{formatCurrency(inv.total, inv.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Notes</p>
              <p className="text-sm text-slate-400">{inv.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
