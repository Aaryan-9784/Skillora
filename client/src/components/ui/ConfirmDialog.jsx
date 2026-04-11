import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

const ConfirmDialog = ({ open, message, onConfirm, onCancel, title = "Confirm action", danger = true }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative card-glass w-full max-w-sm z-10 p-6"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${danger ? "bg-red-50 dark:bg-red-900/20" : "bg-brand-50 dark:bg-brand/10"}`}>
            <AlertTriangle size={18} className={danger ? "text-error" : "text-brand"} />
          </div>
          <h3 className="text-base font-semibold text-ink dark:text-slate-100 mb-1">{title}</h3>
          <p className="text-sm text-ink-secondary mb-5">{message}</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={onConfirm}>
              {danger ? "Delete" : "Confirm"}
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
