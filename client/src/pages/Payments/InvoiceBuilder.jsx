import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, ArrowLeft, FileText, ChevronDown,
  Calendar, Hash, Sparkles, Save, Send,
} from "lucide-react";
import useInvoiceStore from "../../store/invoiceStore";
import useClientStore from "../../store/clientStore";
import { formatCurrency } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────
const iBase = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F9FAFB",
  borderRadius: 10,
  outline: "none",
  fontSize: 13,
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const iFocus = (e) => {
  e.target.style.border = "1px solid rgba(99,91,255,0.5)";
  e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.1)";
};
const iBlur = (e) => {
  e.target.style.border = "1px solid rgba(255,255,255,0.09)";
  e.target.style.boxShadow = "none";
};

// ─────────────────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl overflow-hidden ${className}`}
    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
    {children}
  </div>
);

const CardHeader = ({ title, description, icon: Icon }) => (
  <div className="flex items-center gap-3 px-6 py-4"
    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    {Icon && (
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(99,91,255,0.12)", border: "1px solid rgba(99,91,255,0.2)" }}>
        <Icon size={14} style={{ color: "#635BFF" }} />
      </div>
    )}
    <div>
      <h3 className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>{title}</h3>
      {description && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{description}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// FIELD LABEL
// ─────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9CA3AF" }}>
    {children}{required && <span style={{ color: "#635BFF" }}> *</span>}
  </label>
);

// ─────────────────────────────────────────────────────────
// EMPTY ITEM
// ─────────────────────────────────────────────────────────
const EMPTY_ITEM = { description: "", quantity: 1, rate: 0, amount: 0 };

const TERMS_TEMPLATES = ["Net 30", "Net 15", "Due on receipt", "Net 60"];

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
const InvoiceBuilder = () => {
  const navigate = useNavigate();
  const { createInvoice } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();

  const [saving, setSaving]   = useState(false);
  const [draft, setDraft]     = useState(false);
  const [form, setForm]       = useState({
    clientId: "", projectId: "", dueDate: "", currency: "INR",
    notes: "Thank you for your business!",
    terms: "Payment due within 30 days.", taxRate: 0, discount: 0,
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => { fetchClients(); }, []);

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const setItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      next[i].amount = parseFloat(((next[i].quantity || 0) * (next[i].rate || 0)).toFixed(2));
      return next;
    });
  };

  const addItem    = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  // Real-time totals
  const subtotal  = items.reduce((s, i) => s + (i.amount || 0), 0);
  const taxAmount = parseFloat(((subtotal * (parseFloat(form.taxRate) || 0)) / 100).toFixed(2));
  const discount  = parseFloat(form.discount) || 0;
  const total     = parseFloat((subtotal + taxAmount - discount).toFixed(2));

  const handleSubmit = async (e, asDraft = false) => {
    e.preventDefault();
    setSaving(true);
    setDraft(asDraft);
    try {
      await createInvoice({ ...form, lineItems: items, status: asDraft ? "draft" : "sent" });
      navigate("/payments");
    } finally { setSaving(false); }
  };

  const selectedClient = clients.find(c => c._id === form.clientId);

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(0,212,255,0.04) 0%, transparent 55%)",
      }}>
      <div className="max-w-4xl mx-auto">

        {/* ── Breadcrumb + Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate("/payments")}
            className="flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors duration-150"
            style={{ color: "#4B5563" }}
            onMouseEnter={e => e.currentTarget.style.color = "#9CA3AF"}
            onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>
            <ArrowLeft size={13} />
            Payments / New Invoice
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                Create Invoice
              </h1>
              <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                Fill in the details below to generate a professional invoice
              </p>
            </div>
            {/* Auto-generated invoice number */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)" }}>
              <Hash size={13} style={{ color: "#635BFF" }} />
              <span className="text-xs font-semibold" style={{ color: "#A78BFA" }}>
                INV-{new Date().getFullYear()}{String(new Date().getMonth()+1).padStart(2,"0")}-AUTO
              </span>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Invoice Details ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader title="Invoice Details" description="Select client and set due date" icon={FileText} />
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Client selector */}
                  <div>
                    <Label required>Client</Label>
                    <div className="relative">
                      <select name="clientId" value={form.clientId} onChange={setField} required
                        className="appearance-none w-full pr-9 pl-3 py-2.5 cursor-pointer"
                        style={{ ...iBase }} onFocus={iFocus} onBlur={iBlur}>
                        <option value="" style={{ background: "#0D1526" }}>Select client...</option>
                        {clients.map(c => (
                          <option key={c._id} value={c._id} style={{ background: "#0D1526", color: "#F9FAFB" }}>
                            {c.name}{c.company ? ` — ${c.company}` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#4B5563" }} />
                    </div>
                    {/* Client preview */}
                    {selectedClient && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl"
                        style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.15)" }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)" }}>
                          {selectedClient.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "#E5E7EB" }}>{selectedClient.name}</p>
                          <p className="text-[10px] truncate" style={{ color: "#6B7280" }}>{selectedClient.email}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Due date */}
                  <div>
                    <Label>Due date</Label>
                    <div className="relative">
                      <input type="date" name="dueDate" value={form.dueDate} onChange={setField}
                        className="w-full pl-3 pr-9 py-2.5"
                        style={{ ...iBase, colorScheme: "dark" }} onFocus={iFocus} onBlur={iBlur} />
                      <Calendar size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#4B5563" }} />
                    </div>
                  </div>

                  {/* Currency */}
                  <div>
                    <Label>Currency</Label>
                    <select name="currency" value={form.currency} onChange={setField}
                      className="w-full px-3 py-2.5 appearance-none"
                      style={iBase} onFocus={iFocus} onBlur={iBlur}>
                      {["INR","USD","EUR","GBP","AUD","CAD"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project (optional) */}
                  <div>
                    <Label>Project (optional)</Label>
                    <select name="projectId" value={form.projectId} onChange={setField}
                      className="w-full px-3 py-2.5 appearance-none"
                      style={iBase} onFocus={iFocus} onBlur={iBlur}>
                      <option value="">No project</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── Line Items ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader title="Line Items" description="Add services or products to this invoice" icon={Plus} />
              <div className="px-6 py-5">

                {/* Table header */}
                <div className="hidden sm:grid gap-3 mb-3 px-1"
                  style={{ gridTemplateColumns: "1fr 80px 100px 90px 36px" }}>
                  {["Description", "Qty", "Rate (₹)", "Amount", ""].map((h) => (
                    <span key={h} className="text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: "#374151", textAlign: h === "Amount" ? "right" : h === "Qty" || h === "Rate (₹)" ? "center" : "left" }}>
                      {h}
                    </span>
                  ))}
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((item, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-2 items-center"
                        style={{ gridTemplateColumns: "1fr 80px 100px 90px 36px" }}>

                        {/* Description */}
                        <input placeholder="Service description" value={item.description}
                          onChange={(e) => setItem(i, "description", e.target.value)}
                          required className="w-full px-3 py-2"
                          style={iBase} onFocus={iFocus} onBlur={iBlur} />

                        {/* Qty */}
                        <input type="number" min="0" step="0.01" value={item.quantity}
                          onChange={(e) => setItem(i, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 text-center"
                          style={iBase} onFocus={iFocus} onBlur={iBlur} />

                        {/* Rate */}
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={item.rate || ""}
                          onChange={(e) => setItem(i, "rate", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 text-center"
                          style={iBase} onFocus={iFocus} onBlur={iBlur} />

                        {/* Amount */}
                        <div className="text-right">
                          <span className="text-sm font-bold" style={{ color: item.amount > 0 ? "#A78BFA" : "#4B5563" }}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>

                        {/* Remove */}
                        <div className="flex justify-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100"
                              style={{ color: "#4B5563" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4B5563"; }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add item */}
                <motion.button type="button" onClick={addItem}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                  style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.2)", color: "#A78BFA" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.18)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(99,91,255,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,91,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <Plus size={13} strokeWidth={2.5} />
                  Add line item
                </motion.button>

                {/* ── Totals summary ── */}
                <div className="mt-6 pt-5 flex justify-end"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-full max-w-xs space-y-3">

                    {/* Subtotal */}
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#9CA3AF" }}>Subtotal</span>
                      <span className="font-semibold" style={{ color: "#E5E7EB" }}>{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Tax */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm shrink-0" style={{ color: "#9CA3AF" }}>Tax (%)</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="100" step="0.1" name="taxRate" value={form.taxRate}
                          onChange={setField}
                          className="w-20 px-2 py-1.5 text-right text-sm"
                          style={iBase} onFocus={iFocus} onBlur={iBlur} />
                        <span className="text-xs w-20 text-right" style={{ color: "#635BFF" }}>
                          +{formatCurrency(taxAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm shrink-0" style={{ color: "#9CA3AF" }}>Discount (₹)</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="0.01" name="discount" value={form.discount}
                          onChange={setField}
                          className="w-20 px-2 py-1.5 text-right text-sm"
                          style={iBase} onFocus={iFocus} onBlur={iBlur} />
                        <span className="text-xs w-20 text-right" style={{ color: "#EF4444" }}>
                          -{formatCurrency(discount)}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

                    {/* Total */}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold" style={{ color: "#F9FAFB" }}>Total</span>
                      <motion.span
                        key={total}
                        initial={{ scale: 0.95, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-xl font-extrabold"
                        style={{
                          background: "linear-gradient(135deg, #635BFF, #00D4FF)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}>
                        {formatCurrency(total)}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── Notes + Terms ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader title="Notes & Terms" description="Add a message and payment terms" icon={FileText} />
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label>Notes</Label>
                  <textarea name="notes" value={form.notes} onChange={setField} rows={4}
                    placeholder="Thank you for your business!"
                    className="w-full px-3 py-2.5 text-sm resize-none"
                    style={{ ...iBase, borderRadius: 10 }} onFocus={iFocus} onBlur={iBlur} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Payment terms</Label>
                    {/* Quick templates */}
                    <div className="flex gap-1">
                      {TERMS_TEMPLATES.map((t) => (
                        <button key={t} type="button"
                          onClick={() => setForm(f => ({ ...f, terms: t }))}
                          className="text-[9px] px-1.5 py-0.5 rounded-md transition-all duration-100"
                          style={{ background: "rgba(99,91,255,0.1)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.2)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(99,91,255,0.2)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(99,91,255,0.1)"}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea name="terms" value={form.terms} onChange={setField} rows={4}
                    placeholder="Payment due within 30 days..."
                    className="w-full px-3 py-2.5 text-sm resize-none"
                    style={{ ...iBase, borderRadius: 10 }} onFocus={iFocus} onBlur={iBlur} />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── Actions ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-between gap-3 pb-8">
            {/* Cancel */}
            <motion.button type="button" onClick={() => navigate("/payments")}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
              Cancel
            </motion.button>

            <div className="flex items-center gap-3">
              {/* Save as draft */}
              <motion.button type="button" onClick={(e) => handleSubmit(e, true)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9CA3AF" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#E5E7EB"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9CA3AF"; }}>
                <Save size={13} />
                Save draft
              </motion.button>

              {/* Create Invoice */}
              <motion.button type="submit"
                whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
                  boxShadow: "0 0 20px rgba(99,91,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}>
                {saving && !draft ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Create Invoice
              </motion.button>
            </div>
          </motion.div>

        </form>
      </div>
    </div>
  );
};

export default InvoiceBuilder;
