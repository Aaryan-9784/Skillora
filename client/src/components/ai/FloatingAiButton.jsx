import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import AiChatPanel from "./AiChatPanel";

const FloatingAiButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-2xl bg-gradient-brand
                   flex items-center justify-center shadow-glow text-white
                   hover:shadow-xl transition-shadow"
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          <motion.div key={open ? "x" : "spark"}
            initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}>
            {open ? <X size={18} /> : <Sparkles size={18} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-22 right-6 z-40 w-[380px] max-w-[calc(100vw-24px)]"
            style={{ bottom: "80px" }}
          >
            <AiChatPanel compact onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAiButton;
