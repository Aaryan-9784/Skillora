import { motion } from "framer-motion";

const Tabs = ({ tabs, active, onChange, className = "" }) => (
  <div className={`flex gap-1 bg-surface-secondary dark:bg-dark-muted rounded-xl p-1 ${className}`}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active === tab.id
            ? "text-ink dark:text-slate-100"
            : "text-ink-secondary hover:text-ink dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        {active === tab.id && (
          <motion.div layoutId="tab-bg"
            className="absolute inset-0 bg-white dark:bg-dark-card rounded-lg shadow-xs"
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          {tab.icon && <tab.icon size={14} />}
          {tab.label}
          {tab.count !== undefined && (
            <span className="text-xs bg-surface-secondary dark:bg-dark-muted px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          )}
        </span>
      </button>
    ))}
  </div>
);

export default Tabs;
