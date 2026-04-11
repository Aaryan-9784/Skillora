import { motion } from "framer-motion";
import Button from "../ui/Button";

const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand/10 flex items-center justify-center mb-4">
        <Icon size={28} className="text-brand opacity-70" />
      </div>
    )}
    <h3 className="text-base font-semibold text-ink dark:text-slate-200 mb-1">{title}</h3>
    {description && <p className="text-sm text-ink-secondary max-w-xs">{description}</p>}
    {action && (
      <Button onClick={action} className="mt-5" size="sm">{actionLabel || "Get started"}</Button>
    )}
  </motion.div>
);

export default EmptyState;
