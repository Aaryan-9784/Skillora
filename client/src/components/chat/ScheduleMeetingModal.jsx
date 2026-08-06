import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Video, X, ChevronDown, Clock, Check } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const DURATION_OPTIONS = [
  { value: 15, label: "15 Minutes" },
  { value: 30, label: "30 Minutes" },
  { value: 45, label: "45 Minutes" },
  { value: 60, label: "1 Hour (60 Mins)" },
];

const parseCustomDateTime = (dateText, timeText) => {
  if (!dateText) return "";
  let yyyy, mm, dd;
  const dParts = dateText.split(/[\/\-\.]/);
  if (dParts.length === 3) {
    if (dParts[0].length === 4) {
      [yyyy, mm, dd] = dParts;
    } else {
      dd = dParts[0].padStart(2, "0");
      mm = dParts[1].padStart(2, "0");
      yyyy = dParts[2].length === 2 ? `20${dParts[2]}` : dParts[2];
    }
  } else {
    return "";
  }

  let hours = 10;
  let minutes = 0;
  if (timeText) {
    const isPM = /pm/i.test(timeText);
    const isAM = /am/i.test(timeText);
    const cleanTime = timeText.replace(/(am|pm)/i, "").trim();
    const tParts = cleanTime.split(":");
    if (tParts.length >= 1) {
      hours = parseInt(tParts[0], 10) || 10;
      minutes = parseInt(tParts[1] || "0", 10) || 0;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
  }

  const hStr = String(hours).padStart(2, "0");
  const mStr = String(minutes).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hStr}:${mStr}`;
};

const ScheduleMeetingModal = ({ open, onClose, projectId, participants = [] }) => {
  const [title, setTitle]             = useState("");
  const [dateInput, setDateInput]     = useState("");
  const [timeInput, setTimeInput]     = useState("");
  const [duration, setDuration]       = useState("");
  const [loading, setLoading]         = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title?.trim()) return toast.error("Meeting Topic is mandatory");
    if (!dateInput?.trim() || !timeInput?.trim()) return toast.error("Date & Time are mandatory");
    if (!duration || Number(duration) <= 0) return toast.error("Duration is mandatory");

    const scheduledAt = parseCustomDateTime(dateInput, timeInput);
    if (!scheduledAt) return toast.error("Invalid Date or Time format (Use DD/MM/YYYY & 10:00 AM)");

    setLoading(true);
    try {
      const roomLink = `/client/projects/${projectId}?room=${Date.now()}`;
      await api.post("/meetings/schedule", {
        title: title.trim(),
        projectId,
        scheduledAt,
        durationMins: Number(duration) || 30,
        roomLink,
        participants: participants.map((p) => p._id || p),
      });

      toast.success("Meeting scheduled successfully!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#0D1424] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Top Ambient Glow Line */}
          <div className="absolute top-0 inset-x-0 h-[2px]"
            style={{ background: "linear-gradient(90deg,transparent,#635BFF,#00D4FF,transparent)" }} />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Calendar size={18} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Schedule Meeting</h3>
                <p className="text-[11px] text-slate-400 font-medium">Set up a live WebRTC audio/video session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            {/* Meeting Topic */}
            <div>
              <label className="text-xs font-bold text-slate-300">
                Meeting Topic <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Sprint Review & Milestone Check"
                className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
              />
            </div>

            {/* Date & Time Input (Pure Manual Input DD/MM/YYYY & Time) */}
            <div>
              <label className="text-xs font-bold text-slate-300">
                Date & Time <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 mt-1.5">
                <input
                  type="text"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  required
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs font-semibold placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
                />

                <input
                  type="text"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  required
                  placeholder="10:00 AM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs font-semibold placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Duration Pure Manual Input */}
            <div>
              <label className="text-xs font-bold text-slate-300">
                Duration (Minutes) <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1.5 flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-indigo-400">
                  <Clock size={14} />
                </div>
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 30"
                  required
                  className="w-full pl-10 pr-14 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs font-bold focus:border-indigo-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 text-xs text-slate-400 font-semibold pointer-events-none">
                  mins
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-full border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-[1.5] py-3 rounded-full text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/25"
                style={{ background: "linear-gradient(135deg,#635BFF,#8B5CF6)" }}
              >
                <Video size={14} /> {loading ? "Scheduling…" : "Confirm Schedule"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScheduleMeetingModal;
