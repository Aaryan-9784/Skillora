import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

const ConfirmDialog = ({ open, message, onConfirm, onCancel, title = "Confirm action", danger = true }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm rounded-3xl p-6 z-10 shadow-2xl"
          style={{
            background: "rgba(11,15,26,0.96)",
            backdropFilter: "blur(24px)",
            border: danger ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(99,91,255,0.3)",
            boxShadow: danger ? "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(239,68,68,0.15)" : "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(99,91,255,0.15)",
          }}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${danger ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"}`}>
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-base font-black tracking-tight text-white mb-1">{title}</h3>
          <p className="text-xs font-medium text-slate-400 mb-6">{message}</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 cursor-pointer" onClick={onCancel}>Cancel</Button>
            <Button variant={danger ? "danger" : "primary"} className="flex-1 cursor-pointer" onClick={onConfirm}>
              {danger ? "Delete" : "Confirm"}
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
