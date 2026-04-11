import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FolderKanban, CheckSquare, Settings, LogOut, Moon, Sun, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";

const COMMANDS = [
  { id: "dashboard",  label: "Go to Dashboard",  icon: FolderKanban, action: "nav", path: "/dashboard" },
  { id: "projects",   label: "Go to Projects",    icon: FolderKanban, action: "nav", path: "/projects" },
  { id: "tasks",      label: "Go to Tasks",        icon: CheckSquare,  action: "nav", path: "/tasks" },
  { id: "settings",   label: "Go to Settings",     icon: Settings,     action: "nav", path: "/settings" },
  { id: "theme",      label: "Toggle Dark Mode",   icon: Moon,         action: "theme" },
  { id: "logout",     label: "Sign Out",           icon: LogOut,       action: "logout" },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toggle } = useThemeStore();
  const { logout } = useAuthStore();

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const execute = async (cmd) => {
    onClose();
    if (cmd.action === "nav") navigate(cmd.path);
    else if (cmd.action === "theme") toggle();
    else if (cmd.action === "logout") { await logout(); navigate("/login"); }
  };

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) execute(filtered[selected]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg card-glass overflow-hidden z-10"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border dark:border-dark-border">
              <Search size={16} className="text-ink-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKey}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-sm text-ink dark:text-slate-200 placeholder:text-ink-muted outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-2xs font-medium text-ink-muted bg-surface-secondary dark:bg-dark-muted rounded border border-surface-border dark:border-dark-border">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="py-2 max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-ink-muted py-8">No commands found</p>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelected(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      i === selected
                        ? "bg-brand-50 text-brand dark:bg-brand/15 dark:text-brand-300"
                        : "text-ink dark:text-slate-300 hover:bg-surface-secondary dark:hover:bg-dark-muted"
                    }`}
                  >
                    <cmd.icon size={15} className="shrink-0" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {i === selected && <ArrowRight size={13} className="shrink-0 opacity-60" />}
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-surface-border dark:border-dark-border flex items-center gap-4 text-2xs text-ink-muted">
              <span><kbd className="font-medium">↑↓</kbd> navigate</span>
              <span><kbd className="font-medium">↵</kbd> select</span>
              <span><kbd className="font-medium">esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
