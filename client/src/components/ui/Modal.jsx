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
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
          />

          {/* Panel — ref attached here */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${sizes[size]} card-glass z-10 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-surface-border dark:border-dark-border">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-slate-100">{title}</h2>
                {description && <p className="text-sm text-ink-secondary mt-0.5">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-1.5 rounded-lg text-ink-muted hover:bg-surface-secondary hover:text-ink transition-colors dark:hover:bg-dark-muted"
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
