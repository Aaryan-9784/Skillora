import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import useInvoiceStore from "../../store/invoiceStore";
import useClientStore from "../../store/clientStore";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { formatCurrency } from "../../utils/helpers";

const EMPTY_ITEM = { description: "", quantity: 1, rate: 0, amount: 0 };

const InvoiceBuilder = () => {
  const navigate = useNavigate();
  const { createInvoice } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: "", dueDate: "", notes: "", terms: "", taxRate: 0, discount: 0,
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => { fetchClients(); }, []);

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const setItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      next[i].amount = parseFloat((next[i].quantity * next[i].rate).toFixed(2));
      return next;
    });
  };

  const addItem    = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const subtotal  = items.reduce((s, i) => s + (i.amount || 0), 0);
  const taxAmount = (subtotal * (parseFloat(form.taxRate) || 0)) / 100;
  const discount  = parseFloat(form.discount) || 0;
  const total     = subtotal + taxAmount - discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createInvoice({ ...form, lineItems: items });
      navigate("/payments");
    } finally {
      setSaving(false);
    }
  };

  const clientOptions = [
    { value: "", label: "Select client..." },
    ...clients.map((c) => ({ value: c._id, label: c.name })),
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate("/payments")}
        className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to payments
      </button>

      <h1 className="text-2xl font-bold text-ink dark:text-slate-100 mb-6">New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client + dates */}
        <div className="card">
          <h3 className="font-semibold text-ink dark:text-slate-100 mb-4">Invoice details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Client *" name="clientId" value={form.clientId} onChange={setField} options={clientOptions} />
            <Input label="Due date" name="dueDate" type="date" value={form.dueDate} onChange={setField} />
          </div>
        </div>

        {/* Line items */}
        <div className="card">
          <h3 className="font-semibold text-ink dark:text-slate-100 mb-4">Line items</h3>
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-ink-muted px-1">
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-center">Rate</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-1" />
            </div>

            {items.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 sm:col-span-5">
                  <input className="input" placeholder="Service description" value={item.description}
                    onChange={(e) => setItem(i, "description", e.target.value)} required />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input className="input text-center" type="number" min="0" step="0.01" value={item.quantity}
                    onChange={(e) => setItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input className="input text-center" type="number" min="0" step="0.01" placeholder="0.00" value={item.rate}
                    onChange={(e) => setItem(i, "rate", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-3 sm:col-span-2 text-right">
                  <span className="text-sm font-semibold text-ink dark:text-slate-200">{formatCurrency(item.amount)}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-error transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            <button type="button" onClick={addItem}
              className="flex items-center gap-2 text-sm text-brand hover:text-brand-700 transition-colors mt-2">
              <Plus size={14} /> Add line item
            </button>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-surface-border dark:border-dark-border ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ink-secondary">Subtotal</span>
              <span className="font-medium text-ink dark:text-slate-200">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-ink-secondary">Tax (%)</span>
              <input className="input w-20 text-right" type="number" min="0" max="100" step="0.1"
                name="taxRate" value={form.taxRate} onChange={setField} />
            </div>
            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-ink-secondary">Discount ($)</span>
              <input className="input w-20 text-right" type="number" min="0" step="0.01"
                name="discount" value={form.discount} onChange={setField} />
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-surface-border dark:border-dark-border">
              <span className="text-ink dark:text-slate-100">Total</span>
              <span className="text-brand">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" className="input resize-none h-24" placeholder="Thank you for your business!"
                value={form.notes} onChange={setField} />
            </div>
            <div>
              <label className="label">Payment terms</label>
              <textarea name="terms" className="input resize-none h-24" placeholder="Payment due within 30 days..."
                value={form.terms} onChange={setField} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate("/payments")}>Cancel</Button>
          <Button type="submit" loading={saving}>Create Invoice</Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceBuilder;
