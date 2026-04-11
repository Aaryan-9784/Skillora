import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Pencil, Trash2, Trophy, Zap, Target, TrendingUp } from "lucide-react";
import useSkillStore from "../../store/skillStore";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "development", label: "Development", emoji: "💻" },
  { value: "design",      label: "Design",      emoji: "🎨" },
  { value: "marketing",   label: "Marketing",   emoji: "📣" },
  { value: "writing",     label: "Writing",     emoji: "✍️" },
  { value: "video",       label: "Video",       emoji: "🎬" },
  { value: "audio",       label: "Audio",       emoji: "🎵" },
  { value: "business",    label: "Business",    emoji: "💼" },
  { value: "other",       label: "Other",       emoji: "⚡" },
];

const LEVEL_CONFIG = {
  beginner:     { color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", glow: "rgba(156,163,175,0.3)", label: "Beginner",     xp: 100  },
  intermediate: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  glow: "rgba(59,130,246,0.3)",  label: "Intermediate", xp: 300  },
  advanced:     { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  glow: "rgba(139,92,246,0.3)",  label: "Advanced",     xp: 600  },
  expert:       { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  glow: "rgba(245,158,11,0.4)",  label: "Expert",       xp: 1000 },
};

const CAT_COLORS = {
  development: "#635BFF", design: "#EC4899", marketing: "#F59E0B",
  writing: "#22C55E", video: "#EF4444", audio: "#00D4FF",
  business: "#8B5CF6", other: "#9CA3AF",
};

// ─────────────────────────────────────────────────────────
// SHARED FORM STYLES
// ─────────────────────────────────────────────────────────
const iStyle = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  color: "#F9FAFB", borderRadius: 10, padding: "10px 14px", fontSize: 14,
  outline: "none", width: "100%", transition: "border-color 0.15s, box-shadow 0.15s",
};
const lStyle = { color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };
const iFocus = (e) => { e.target.style.border = "1px solid rgba(99,91,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,91,255,0.12)"; };
const iBlur  = (e) => { e.target.style.border = "1px solid rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; };

// ─────────────────────────────────────────────────────────
// LEVEL BADGE
// ─────────────────────────────────────────────────────────
const LevelBadge = ({ levelLabel }) => {
  const cfg = LEVEL_CONFIG[levelLabel?.toLowerCase()] || LEVEL_CONFIG.beginner;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25`, boxShadow: `0 0 8px ${cfg.glow}` }}>
      {levelLabel === "expert" && "⭐ "}
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// CIRCULAR PROGRESS
// ─────────────────────────────────────────────────────────
const CircularProgress = ({ value, color, size = 56 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: "#F9FAFB", fontSize: 11, fontWeight: 700, transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}>
        {value}%
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────
// SKILL CARD
// ─────────────────────────────────────────────────────────
const SkillCard = ({ skill, index, onEdit, onDelete }) => {
  const levelKey = skill.levelLabel?.toLowerCase() || "beginner";
  const cfg      = LEVEL_CONFIG[levelKey] || LEVEL_CONFIG.beginner;
  const catColor = CAT_COLORS[skill.category] || "#635BFF";
  const catEmoji = CATEGORIES.find(c => c.value === skill.category)?.emoji || "⚡";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative rounded-2xl p-5 flex flex-col gap-4 group overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${cfg.color}35`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${cfg.color}18`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)` }} />

      {/* Top gradient line */}
      <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* Category emoji badge */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ background: `${catColor}18`, border: `1px solid ${catColor}25` }}>
            {catEmoji}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#F9FAFB" }}>{skill.name}</p>
            <p className="text-[10px] capitalize mt-0.5" style={{ color: "#4B5563" }}>{skill.category}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button onClick={() => onEdit(skill)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,91,255,0.15)"; e.currentTarget.style.color = "#A78BFA"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
            <Pencil size={11} />
          </button>
          <button onClick={() => onDelete(skill._id)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-100"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Progress + circular */}
      <div className="flex items-center gap-4">
        <CircularProgress value={skill.level} color={cfg.color} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <LevelBadge levelLabel={skill.levelLabel} />
            <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>{skill.level}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${skill.level}%` }}
              transition={{ duration: 0.9, delay: index * 0.05 + 0.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}99)`,
                boxShadow: `0 0 8px ${cfg.glow}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* XP badge */}
      <div className="flex items-center justify-between pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#4B5563" }}>
          <Zap size={10} style={{ color: cfg.color }} />
          <span>{LEVEL_CONFIG[levelKey]?.xp || 0} XP</span>
        </div>
        {skill.yearsOfExperience > 0 && (
          <span className="text-[10px]" style={{ color: "#4B5563" }}>
            {skill.yearsOfExperience}y exp
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center py-24 text-center relative"
  >
    {/* Radial glow */}
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.07) 0%, transparent 70%)" }} />
    </div>

    {/* Floating icon */}
    <div className="relative mb-8">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(99,91,255,0.15) 0%, rgba(139,92,246,0.08) 100%)",
          border: "1px solid rgba(99,91,255,0.25)",
          boxShadow: "0 0 48px rgba(99,91,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <Sparkles size={40} style={{ color: "#635BFF" }} strokeWidth={1.4} />
      </motion.div>

      {/* Orbiting XP dots */}
      {[
        { color: "#F59E0B", angle: 0   },
        { color: "#22C55E", angle: 120 },
        { color: "#635BFF", angle: 240 },
      ].map((d, i) => (
        <motion.div key={i}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{
            background: d.color,
            boxShadow: `0 0 10px ${d.color}`,
            top: `calc(50% + ${Math.sin((d.angle * Math.PI) / 180) * 52}px - 5px)`,
            left: `calc(50% + ${Math.cos((d.angle * Math.PI) / 180) * 52}px - 5px)`,
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>

    <h3 className="text-2xl font-bold mb-3"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
      No skills yet
    </h3>
    <p className="text-sm max-w-sm leading-relaxed mb-2" style={{ color: "#6B7280" }}>
      Track your skills, measure your progress, and grow your expertise over time.
    </p>
    <p className="text-sm mb-8" style={{ color: "#4B5563" }}>Every expert was once a beginner 🚀</p>

    <motion.button
      whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(99,91,255,0.5)" }}
      whileTap={{ scale: 0.96 }}
      onClick={onAdd}
      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
      style={{
        background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
        boxShadow: "0 0 20px rgba(99,91,255,0.35)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <Plus size={16} strokeWidth={2.5} />
      Add your first skill
    </motion.button>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// SKILL FORM
// ─────────────────────────────────────────────────────────
const SkillForm = ({ initial = {}, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({ name: "", category: "development", level: 50, yearsOfExperience: 0, ...initial });
  const set = (e) => setForm((f) => ({
    ...f,
    [e.target.name]: ["level","yearsOfExperience"].includes(e.target.name) ? Number(e.target.value) : e.target.value,
  }));

  const levelLabel = form.level <= 25 ? "Beginner" : form.level <= 50 ? "Intermediate" : form.level <= 75 ? "Advanced" : "Expert";
  const cfg = LEVEL_CONFIG[levelLabel.toLowerCase()] || LEVEL_CONFIG.beginner;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label style={lStyle}>Skill name *</label>
        <input name="name" placeholder="e.g. React.js" value={form.name} onChange={set}
          required style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>
      <div>
        <label style={lStyle}>Category</label>
        <select name="category" value={form.category} onChange={set}
          style={{ ...iStyle, cursor: "pointer" }} onFocus={iFocus} onBlur={iBlur}>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value} style={{ background: "#0D1526", color: "#F9FAFB" }}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Level slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label style={{ ...lStyle, marginBottom: 0 }}>Proficiency level</label>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
            {levelLabel} — {form.level}%
          </span>
        </div>
        <input type="range" name="level" min="1" max="100" value={form.level} onChange={set}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: cfg.color, background: `linear-gradient(to right, ${cfg.color} ${form.level}%, rgba(255,255,255,0.1) ${form.level}%)` }} />
        <div className="flex justify-between mt-1.5">
          {["Beginner","Intermediate","Advanced","Expert"].map(l => (
            <span key={l} className="text-[9px]" style={{ color: "#374151" }}>{l}</span>
          ))}
        </div>
      </div>

      <div>
        <label style={lStyle}>Years of experience</label>
        <input name="yearsOfExperience" type="number" min="0" max="50" placeholder="0"
          value={form.yearsOfExperience} onChange={set} style={iStyle} onFocus={iFocus} onBlur={iBlur} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
          Cancel
        </button>
        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{
            background: loading ? "rgba(99,91,255,0.5)" : "linear-gradient(135deg,#635BFF,#8B5CF6)",
            boxShadow: loading ? "none" : "0 0 16px rgba(99,91,255,0.35)",
          }}>
          {loading ? "Saving…" : initial._id ? "Save changes" : "Add Skill"}
        </motion.button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────
const SkillModal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ background: "rgba(4,8,18,0.8)", backdropFilter: "blur(10px)" }}
          onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden z-10"
          style={{
            background: "linear-gradient(160deg,rgba(13,20,40,0.99) 0%,rgba(8,14,28,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 0 0 1px rgba(99,91,255,0.15), 0 32px 64px rgba(0,0,0,0.7)",
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.6),rgba(0,212,255,0.4),transparent)" }} />
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-base font-semibold" style={{ color: "#F9FAFB" }}>{title}</h2>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
              style={{ color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#E5E7EB"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}>
              ✕
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────
// STATS BAR (top summary)
// ─────────────────────────────────────────────────────────
const StatsBar = ({ skills }) => {
  const totalXP   = skills.reduce((s, sk) => s + (LEVEL_CONFIG[sk.levelLabel?.toLowerCase()]?.xp || 0), 0);
  const avgLevel  = skills.length ? Math.round(skills.reduce((s, sk) => s + sk.level, 0) / skills.length) : 0;
  const experts   = skills.filter(s => s.levelLabel === "expert").length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { icon: Zap,       label: "Total XP",    value: `${totalXP.toLocaleString()} XP`, color: "#F59E0B" },
        { icon: Target,    label: "Avg. Level",  value: `${avgLevel}%`,                   color: "#635BFF" },
        { icon: Trophy,    label: "Expert Skills", value: experts,                         color: "#22C55E" },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
            <Icon size={16} style={{ color }} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "#F9FAFB" }}>{value}</p>
            <p className="text-[10px]" style={{ color: "#4B5563" }}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
const Skills = () => {
  const { skills, categories, fetchSkills, createSkill, updateSkill, deleteSkill, isLoading } = useSkillStore();
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { fetchSkills(); }, []);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (modal?._id) await updateSkill(modal._id, form);
      else await createSkill(form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    await deleteSkill(deleteId);
    setDeleteId(null);
    setConfirmOpen(false);
  };

  const radarData = skills.slice(0, 8).map(s => ({ subject: s.name, level: s.level }));

  return (
    <div className="min-h-screen p-6 lg:p-8"
      style={{
        background: "radial-gradient(ellipse at 25% 0%, rgba(99,91,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 75% 100%, rgba(245,158,11,0.04) 0%, transparent 55%)",
      }}>
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Skills
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              {skills.length === 0
                ? "Start building your skill portfolio"
                : `${skills.length} skill${skills.length !== 1 ? "s" : ""} tracked`}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal({})}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
            <Plus size={15} strokeWidth={2.5} />
            Add Skill
          </motion.button>
        </motion.div>

        {/* ── CONTENT ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse h-44"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <EmptyState onAdd={() => setModal({})} />
        ) : (
          <>
            {/* Stats bar */}
            <StatsBar skills={skills} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar chart */}
              {radarData.length >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-5 lg:col-span-1"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "#F9FAFB" }}>Skill Radar</h3>
                  <p className="text-xs mb-4" style={{ color: "#4B5563" }}>Top {radarData.length} skills</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6B7280" }} />
                      <Radar dataKey="level" stroke="#635BFF" fill="#635BFF" fillOpacity={0.15} strokeWidth={2}
                        dot={{ fill: "#635BFF", r: 3 }} />
                      <Tooltip
                        formatter={(v) => [`${v}%`, "Level"]}
                        contentStyle={{
                          background: "rgba(10,17,32,0.97)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 10,
                          fontSize: 12,
                          color: "#F9FAFB",
                        }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Skill cards grid */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 content-start ${radarData.length >= 3 ? "lg:col-span-2" : "lg:col-span-3 sm:grid-cols-3"}`}>
                <AnimatePresence>
                  {skills.map((skill, i) => (
                    <SkillCard key={skill._id} skill={skill} index={i}
                      onEdit={(s) => setModal(s)}
                      onDelete={(id) => { setDeleteId(id); setConfirmOpen(true); }} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      <SkillModal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?._id ? "Edit Skill" : "Add Skill"}>
        <SkillForm initial={modal || {}} onSubmit={handleSubmit} onClose={() => setModal(null)} loading={saving} />
      </SkillModal>

      {/* Confirm delete */}
      <AnimatePresence>
        {confirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0" style={{ background: "rgba(4,8,18,0.8)", backdropFilter: "blur(10px)" }}
              onClick={() => setConfirmOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-sm rounded-2xl p-6 z-10"
              style={{
                background: "rgba(13,20,40,0.99)",
                border: "1px solid rgba(239,68,68,0.2)",
                boxShadow: "0 0 0 1px rgba(239,68,68,0.1), 0 24px 48px rgba(0,0,0,0.6)",
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(239,68,68,0.12)" }}>
                <Trash2 size={18} style={{ color: "#EF4444" }} />
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: "#F9FAFB" }}>Remove skill</h3>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Remove this skill from your profile?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}>
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", boxShadow: "0 0 12px rgba(239,68,68,0.3)" }}>
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Skills;
