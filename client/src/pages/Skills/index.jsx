import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Pencil, Trash2 } from "lucide-react";
import useSkillStore from "../../store/skillStore";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { SkeletonCard } from "../../components/ui/Skeleton";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";

const CATEGORIES = [
  { value: "development", label: "Development" },
  { value: "design",      label: "Design" },
  { value: "marketing",   label: "Marketing" },
  { value: "writing",     label: "Writing" },
  { value: "video",       label: "Video" },
  { value: "audio",       label: "Audio" },
  { value: "business",    label: "Business" },
  { value: "other",       label: "Other" },
];

const LEVEL_COLORS = {
  beginner:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  intermediate: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  advanced:     "bg-brand-50 text-brand dark:bg-brand/20 dark:text-brand-300",
  expert:       "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const SkillForm = ({ initial = {}, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({ name: "", category: "development", level: 50, ...initial });
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.name === "level" ? Number(e.target.value) : e.target.value }));

  const levelLabel = form.level <= 25 ? "Beginner" : form.level <= 50 ? "Intermediate" : form.level <= 75 ? "Advanced" : "Expert";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input label="Skill name *" name="name" placeholder="e.g. React.js" value={form.name} onChange={set} required />
      <Select label="Category" name="category" value={form.category} onChange={set} options={CATEGORIES} />
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Proficiency level</label>
          <span className={`badge ${LEVEL_COLORS[levelLabel.toLowerCase()] || ""}`}>{levelLabel} — {form.level}%</span>
        </div>
        <input type="range" name="level" min="1" max="100" value={form.level} onChange={set}
          className="w-full h-2 rounded-full appearance-none bg-surface-border dark:bg-dark-border accent-brand cursor-pointer" />
        <div className="flex justify-between text-2xs text-ink-muted mt-1">
          <span>Beginner</span><span>Intermediate</span><span>Advanced</span><span>Expert</span>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>{initial._id ? "Save" : "Add Skill"}</Button>
      </div>
    </form>
  );
};

const Skills = () => {
  const { skills, categories, fetchSkills, createSkill, updateSkill, deleteSkill, isLoading } = useSkillStore();
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchSkills(); }, []);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (modal?._id) await updateSkill(modal._id, form);
      else await createSkill(form);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  // Radar chart data — top 8 skills by level
  const radarData = skills.slice(0, 8).map((s) => ({ subject: s.name, level: s.level }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-slate-100">Skills</h1>
          <p className="text-sm text-ink-secondary mt-0.5">{skills.length} skills tracked</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setModal({})}>Add Skill</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState icon={Sparkles} title="No skills yet" description="Track your proficiency levels and showcase your expertise."
          action={() => setModal({})} actionLabel="Add your first skill" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar chart */}
          {radarData.length >= 3 && (
            <div className="card lg:col-span-1">
              <h3 className="font-semibold text-ink dark:text-slate-100 mb-4">Skill radar</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E3E8EF" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <Radar dataKey="level" stroke="#635BFF" fill="#635BFF" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${v}%`, "Level"]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Skills by category */}
          <div className={`space-y-4 ${radarData.length >= 3 ? "lg:col-span-2" : "lg:col-span-3"}`}>
            {categories.map((cat) => (
              <div key={cat._id} className="card">
                <h3 className="font-semibold text-ink dark:text-slate-100 capitalize mb-3">{cat._id}</h3>
                <div className="space-y-3">
                  {cat.skills.map((skill) => {
                    const full = skills.find((s) => s.name === skill.name);
                    return (
                      <div key={skill.name} className="flex items-center gap-3 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-ink dark:text-slate-200">{skill.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`badge ${LEVEL_COLORS[skill.levelLabel] || ""}`}>{skill.levelLabel}</span>
                              <span className="text-xs text-ink-muted">{skill.level}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-surface-border dark:bg-dark-border rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${skill.level}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-brand rounded-full" />
                          </div>
                        </div>
                        {full && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => setModal(full)} className="p-1 rounded-md hover:bg-surface-secondary dark:hover:bg-dark-muted text-ink-muted hover:text-brand transition-colors">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => setDeleteId(full._id)} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-muted hover:text-error transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?._id ? "Edit Skill" : "Add Skill"}>
        <SkillForm initial={modal || {}} onSubmit={handleSubmit} onClose={() => setModal(null)} loading={saving} />
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Remove skill"
        message="Remove this skill from your profile?"
        onConfirm={async () => { await deleteSkill(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default Skills;
