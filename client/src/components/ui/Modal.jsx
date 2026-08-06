import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

const Modal = ({ isOpen, onClose, title, description, children, size = "md", footer }) => {
  const panelRef = useRef(null);

  // Close on click outside the panel
  useClickOutside(panelRef, onClose, { enabled: isOpen });

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${sizes[size]} rounded-3xl z-10 overflow-hidden shadow-2xl`}
            style={{
              background: "rgba(11,15,26,0.96)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 50px rgba(99,91,255,0.15)",
            }}
          >
            {/* Top Shimmer Line */}
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg,transparent,rgba(99,91,255,0.4),transparent)" }} />

            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
                {description && <p className="text-xs font-medium text-slate-400 mt-1">{description}</p>}
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
      )}
    </AnimatePresence>
  );
};

export default Modal;
