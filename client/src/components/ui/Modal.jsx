import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

const Modal = ({ isOpen, onClose, title, description, icon: Icon, children, size = "md", footer }) => {
  const panelRef = useRef(null);

  // Close on click outside the panel
  useClickOutside(panelRef, onClose, { enabled: isOpen });

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full ${sizes[size]} rounded-3xl z-10 overflow-hidden shadow-2xl my-auto`}
          style={{
            background: "rgba(11,15,26,0.98)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 50px rgba(99,91,255,0.2)",
          }}
        >
          {/* Top Shimmer Line */}
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.4),transparent)" }}
          />

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Icon size={20} />
                </div>
              )}
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
                {description && <p className="text-xs font-medium text-slate-400 mt-1">{description}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 pb-6 pt-0 flex items-center justify-end gap-3 border-t border-surface-border dark:border-dark-border">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};

export default Modal;
