/**
 * FloatingAiButton — Premium floating AI widget entry point.
 *
 * Features:
 * - Gradient pulse button with tooltip
 * - Smooth scale-up panel animation (origin: bottom-right)
 * - Click-outside + ESC key closes the panel
 * - Toggle button closes when panel is open
 * - Mobile: full-screen modal
 * - Desktop: bottom-right popup (380px wide)
 */

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";
import AiWidgetPanel from "./AiWidgetPanel";

const FloatingAiButton = () => {
  const [open, setOpen] = useState(false);
  const panelRef        = useRef(null);
  const buttonRef       = useRef(null);

  // Close on click-outside (excludes the toggle button itself)
  const handleOutside = useCallback(
    (e) => {
      // Don't close if the click was on the toggle button — its own onClick handles that
      if (buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    },
    []
  );

  useClickOutside(panelRef, handleOutside, { enabled: open, escKey: true });

  return (
    <>
      {/* ── Floating toggle button ── */}
      <div className="fixed bottom-6 right-6 z-50 group" ref={buttonRef}>
        {/* Tooltip */}
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none
                         whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-xl
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{
                background: "rgba(10,17,32,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#E5E7EB",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              Ask Skillora AI
              {/* Arrow */}
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent"
                style={{ borderLeftColor: "rgba(10,17,32,0.95)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer pulse ring */}
        {!open && (
          <motion.div
            animate={{ scale: [1, 1.55, 1], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "linear-gradient(135deg, #635BFF, #8B5CF6)" }}
          />
        )}

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
          className="relative w-14 h-14 rounded-full flex items-center justify-center text-white"
          style={{
            background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 60%, #7C3AED 100%)",
            boxShadow: open
              ? "0 0 0 3px rgba(99,91,255,0.35), 0 8px 32px rgba(99,91,255,0.55)"
              : "0 0 32px rgba(99,91,255,0.65), 0 0 64px rgba(99,91,255,0.2), 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={open ? "x" : "spark"}
              initial={{ rotate: -45, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 45, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {open ? <X size={20} strokeWidth={2.5} /> : <Sparkles size={20} strokeWidth={1.8} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformOrigin: "bottom right",
                bottom: "88px",
                right: "24px",
              }}
              className="fixed z-50
                         w-[calc(100vw-32px)] max-w-[400px]
                         md:w-[400px]
                         /* Mobile: full-screen */
                         max-md:!bottom-0 max-md:!right-0 max-md:!left-0
                         max-md:!w-full max-md:!max-w-full max-md:!rounded-b-none
                         max-md:!h-[92dvh]"
            >
              <AiWidgetPanel onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAiButton;
