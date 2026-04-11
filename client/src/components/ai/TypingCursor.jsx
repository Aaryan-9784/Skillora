import { motion } from "framer-motion";

const TypingCursor = () => (
  <motion.span
    animate={{ opacity: [1, 0, 1] }}
    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    className="inline-block w-0.5 h-4 bg-brand ml-0.5 align-middle rounded-full"
  />
);

export default TypingCursor;
