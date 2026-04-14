import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Shield, Zap, AlertTriangle, Save,
  Mail, Tag, Users, Lock, Bot, ChevronDown,
  CheckCircle, Loader,
} from "lucide-react";
import useAdminStore from "../../store/adminStore";

// ─── noise texture ─────────────────────────────────────────────────────────
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

// ─── Toggle ────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, color = "#635BFF" }) => (
  <motion.button
    onClick={() => onChange(!value)}
    whileTap={{ scale: 0.93 }}
    className="relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
    style={{
      background: value
        ? `linear-gradient(135deg, ${color}, #8B5CF6)`
        : "rgba(255,255,255,0.08)",
      boxShadow: value ? `0 0 16px ${color}55` : "none",
      border: value ? "none" : "1px solid rgba(255,255,255,0.1)",
    }}
  >
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-md"
      style={{ left: value ? "calc(100% - 21px)" : "3px" }}
    />
  </motion.button>
);

// ─── Text Input ────────────────────────────────────────────────────────────
const TextInput = ({ value, onChange, placeholder, icon: Icon }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex items-center">
      {Icon && (
        <Icon size={13} className="absolute left-3 pointer-events-none"
          style={{ color: focused ? "#A78BFA" : "rgba(100,116,139,0.5)" }} />
      )}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="text-sm outline-none transition-all duration-200 rounded-xl"
        style={{
          width: 220,
          padding: Icon ? "9px 12px 9px 30px" : "9px 12px",
          background: focused ? "rgba(99,91,255,0.08)" : "rgba(255,255,255,0.04)",
          border: focused ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.08)",
          color: "#F1F5F9",
          boxShadow: focused ? "0 0 0 3px rgba(99,91,255,0.1)" : "none",
        }}
      />
    </div>
  );
};

// ─── Number Input ──────────────────────────────────────────────────────────
const NumberInput = ({ value, onChange, min = 0, max }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="number" value={value}
      onChange={e => onChange(Number(e.target.value))}
      min={min} max={max}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="text-sm outline-none transition-all duration-200 rounded-xl text-center"
      style={{
        width: 100,
        padding: "9px 12px",
        background: focused ? "rgba(99,91,255,0.08)" : "rgba(255,255,255,0.04)",
        border: focused ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.08)",
        color: "#F1F5F9",
        boxShadow: focused ? "0 0 0 3px rgba(99,91,255,0.1)" : "none",
      }}
    />
  );
};

// ─── Select Input ──────────────────────────────────────────────────────────
const SelectInput = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm rounded-xl transition-all duration-200"
        style={{
          width: 140,
          padding: "9px 12px",
          background: open ? "rgba(99,91,255,0.1)" : "rgba(255,255,255,0.04)",
          border: open ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)",
          color: "#F1F5F9",
          justifyContent: "space-between",
        }}
      >
        <span>{selected?.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} style={{ color: "rgba(148,163,184,0.6)" }} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-40 rounded-xl overflow-hidden py-1"
            style={{
              background: "rgba(10,14,30,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            {options.map(opt => (
              <button key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] transition-colors"
                style={{ color: opt.value === value ? "#A78BFA" : "rgba(203,213,225,0.8)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {opt.label}
                {opt.value === value && <CheckCircle size={12} style={{ color: "#A78BFA" }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Field Row ─────────────────────────────────────────────────────────────
const Field = ({ label, hint, children, last }) => (
  <div
    className="flex items-center justify-between gap-4 py-4"
    style={{ borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)" }}
  >
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-white leading-tight">{label}</p>
      {hint && <p className="text-[11px] mt-0.5" style={{ color: "rgba(100,116,139,0.65)" }}>{hint}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

// ─── Section Card ──────────────────────────────────────────────────────────
const Card = ({ icon: Icon, title, subtitle, color, children, delay, danger }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    className="relative overflow-hidden rounded-2xl"
    style={{
      background: danger
        ? "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(255,255,255,0.02) 100%)"
        : "rgba(255,255,255,0.03)",
      backdropFilter: "blur(14px)",
      border: danger
        ? "1px solid rgba(239,68,68,0.15)"
        : "1px solid rgba(255,255,255,0.06)",
      boxShadow: danger
        ? "0 0 40px rgba(239,68,68,0.06)"
        : `0 0 40px rgba(99,102,241,0.06)`,
    }}
  >
    {/* top glow line */}
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{
        background: danger
          ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)"
          : `linear-gradient(90deg, transparent, ${color}55, transparent)`,
      }} />

    {/* ambient corner glow */}
    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${danger ? "rgba(239,68,68,0.07)" : color + "0a"} 0%, transparent 70%)` }} />

    <div className="p-6">
      {/* card header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: danger ? "rgba(239,68,68,0.1)" : `${color}14`,
            border: danger ? "1px solid rgba(239,68,68,0.25)" : `1px solid ${color}30`,
            boxShadow: danger ? "0 0 16px rgba(239,68,68,0.15)" : `0 0 16px ${color}20`,
          }}>
          <Icon size={17} style={{ color: danger ? "#F87171" : color }} />
        </div>
        <div>
          <p className="text-[14px] font-bold text-white leading-tight">{title}</p>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "rgba(100,116,139,0.65)" }}>{subtitle}</p>}
        </div>
      </div>

      {children}
    </div>
  </motion.div>
);

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ active, labels = ["Active", "Inactive"] }) => (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
    style={{
      background: active ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)",
      color: active ? "#4ADE80" : "rgba(100,116,139,0.7)",
      border: active ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(100,116,139,0.15)",
    }}>
    {active ? labels[0] : labels[1]}
  </span>
);

// ─── Main ──────────────────────────────────────────────────────────────────
const AdminSettings = () => {
  const { config, fetchConfig, saveConfig } = useAdminStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchConfig(); }, []);
  useEffect(() => { if (config && !form) setForm({ ...config }); }, [config]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveConfig(form);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (!form) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,91,255,0.08) 0%, transparent 60%)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color: "rgba(100,116,139,0.6)" }}>Loading settings…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{
        background: `${NOISE}, radial-gradient(ellipse 90% 60% at 70% 10%, rgba(99,91,255,0.07) 0%, transparent 55%), linear-gradient(180deg, #0B0F1A 0%, #080C18 100%)`,
      }}
    >
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,91,255,0.06) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-start justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-[28px] font-black tracking-tight leading-tight pb-1"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Platform Settings
            </h1>
            <p className="text-sm mt-2" style={{ color: "rgba(100,116,139,0.75)" }}>
              Manage system behaviour and configuration
            </p>
          </div>

          {/* Save button removed from header — now at bottom */}
        </motion.div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* General */}
          <Card icon={Globe} title="General" subtitle="Platform identity & defaults" color="#635BFF" delay={0}>
            <Field label="Platform Name" hint="Displayed in emails and UI">
              <TextInput value={form.platformName} onChange={v => set("platformName", v)}
                placeholder="Skillora" icon={Tag} />
            </Field>
            <Field label="Support Email" hint="Users contact this address">
              <TextInput value={form.supportEmail} onChange={v => set("supportEmail", v)}
                placeholder="support@skillora.app" icon={Mail} />
            </Field>
            <Field label="Default Plan" hint="Plan assigned on registration" last>
              <SelectInput value={form.defaultPlan} onChange={v => set("defaultPlan", v)}
                options={[
                  { value: "free",    label: "Free"    },
                  { value: "pro",     label: "Pro"     },
                  { value: "premium", label: "Premium" },
                ]} />
            </Field>
          </Card>

          {/* Access Control */}
          <Card icon={Shield} title="Access Control" subtitle="Registration & visibility rules" color="#A78BFA" delay={0.08}>
            <Field label="Allow Registrations" hint="New users can sign up publicly">
              <div className="flex items-center gap-3">
                <StatusBadge active={form.allowRegistrations} labels={["Open", "Closed"]} />
                <Toggle value={form.allowRegistrations} onChange={v => set("allowRegistrations", v)} color="#A78BFA" />
              </div>
            </Field>
            <Field label="Maintenance Mode" hint="Blocks all non-admin access" last>
              <div className="flex items-center gap-3">
                <StatusBadge active={form.maintenanceMode} labels={["On", "Off"]} />
                <Toggle value={form.maintenanceMode} onChange={v => set("maintenanceMode", v)} color="#F59E0B" />
              </div>
            </Field>
          </Card>

          {/* AI Limits */}
          <Card icon={Zap} title="AI Limits" subtitle="Usage caps per user" color="#22D3EE" delay={0.16}>
            <Field label="Max AI Requests / Day" hint="Per user daily cap (1–1000)" last>
              <div className="flex items-center gap-3">
                {/* visual bar */}
                <div className="w-24 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((form.maxAiRequestsPerDay / 1000) * 100, 100)}%`,
                      background: "linear-gradient(90deg, #22D3EE, #818CF8)",
                    }} />
                </div>
                <NumberInput value={form.maxAiRequestsPerDay}
                  onChange={v => set("maxAiRequestsPerDay", v)} min={1} max={1000} />
              </div>
            </Field>
          </Card>

          {/* Danger Zone */}
          <Card icon={AlertTriangle} title="Danger Zone" subtitle="Irreversible platform actions" delay={0.24} danger>
            <Field label="Maintenance Mode" hint="Show maintenance page to all non-admin users" last>
              <div className="flex items-center gap-3">
                <StatusBadge active={form.maintenanceMode} labels={["Active", "Inactive"]} />
                <Toggle value={form.maintenanceMode} onChange={v => set("maintenanceMode", v)} color="#EF4444" />
              </div>
            </Field>

            <AnimatePresence>
              {form.maintenanceMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "#F87171" }} />
                    <p className="text-[12px] leading-relaxed font-medium" style={{ color: "#FCA5A5" }}>
                      Maintenance mode is <span style={{ color: "#F87171", fontWeight: 700 }}>active</span>.
                      All non-admin users are currently blocked from accessing the platform.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

        </div>

        {/* ── Bottom save button (left-aligned) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8 flex items-center"
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSave}
            disabled={saving}
            className="relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white overflow-hidden transition-all"
            style={{
              background: saved
                ? "linear-gradient(135deg, #10B981, #059669)"
                : "linear-gradient(135deg, #635BFF, #8B5CF6)",
              boxShadow: saved
                ? "0 0 24px rgba(16,185,129,0.4)"
                : "0 0 24px rgba(99,91,255,0.4)",
              opacity: saving ? 0.85 : 1,
            }}
          >
            {/* shimmer */}
            <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              <span className="absolute inset-y-0 -left-full w-1/2 bg-white/10 skew-x-12"
                style={{ animation: saving ? "none" : "shimmer 2.5s infinite" }} />
            </span>
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Loader size={14} className="animate-spin" />
                  Saving…
                </motion.span>
              ) : saved ? (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  Saved
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Save size={14} />
                  Save Changes
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { left: -100%; }
          60%  { left: 150%;  }
          100% { left: 150%;  }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
