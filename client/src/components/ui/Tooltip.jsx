import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Tooltip = ({ children, content, side = "top" }) => {
  const [show, setShow] = useState(false);

  const positions = {
    top:    "-top-9 left-1/2 -translate-x-1/2",
    bottom: "-bottom-9 left-1/2 -translate-x-1/2",
    left:   "top-1/2 -translate-y-1/2 -left-2 -translate-x-full",
    right:  "top-1/2 -translate-y-1/2 -right-2 translate-x-full",
  };

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-navy rounded-lg whitespace-nowrap pointer-events-none ${positions[side]}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
