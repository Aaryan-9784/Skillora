import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FolderKanban, CheckSquare, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useDebounce from "../../hooks/useDebounce";
import useClickOutside from "../../hooks/useClickOutside";
import Badge from "./Badge";

const ICONS = { project: FolderKanban, task: CheckSquare, client: Users };

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState({ projects: [], tasks: [], clients: [] });
  const [loading, setLoading] = useState(false);
  const inputRef  = useRef(null);
  const panelRef  = useRef(null);
  const navigate  = useNavigate();
  const debounced = useDebounce(query, 300);

  // Close on click outside
  useClickOutside(panelRef, onClose, { enabled: isOpen });

  useEffect(() => {
    if (isOpen) { setQuery(""); setResults({ projects: [], tasks: [], clients: [] }); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen]);

  useEffect(() => {
    if (!debounced.trim()) { setResults({ projects: [], tasks: [], clients: [] }); return; }
    const search = async () => {
      setLoading(true);
      try {
        const [pRes, tRes, cRes] = await Promise.all([
          api.get("/projects", { params: { search: debounced, limit: 4 } }),
          api.get("/projects/tasks", { params: { search: debounced, limit: 4 } }).catch(() => ({ data: { data: { data: [] } } })),
          api.get("/clients",  { params: { search: debounced, limit: 4 } }),
        ]);
        setResults({
          projects: pRes.data.data.data || [],
          tasks:    tRes.data.data.data || [],
          clients:  cRes.data.data.data || [],
        });
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [debounced]);

  const total = results.projects.length + results.tasks.length + results.clients.length;

  const go = (path) => { navigate(path); onClose(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            ref={panelRef}
            className="relative w-full max-w-xl card-glass z-10 overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border dark:border-dark-border">
              <Search size={16} className="text-ink-muted shrink-0" />
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, tasks, clients..."
                className="flex-1 bg-transparent text-sm text-ink dark:text-slate-200 placeholder:text-ink-muted outline-none" />
              {query && (
                <button onClick={() => setQuery("")} className="text-ink-muted hover:text-ink transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto py-2">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && query && total === 0 && (
                <p className="text-center text-sm text-ink-muted py-8">No results for &quot;{query}&quot;</p>
              )}

              {!loading && !query && (
                <p className="text-center text-sm text-ink-muted py-8">Start typing to search...</p>
              )}

              {[
                { key: "projects", label: "Projects", icon: FolderKanban, path: (r) => `/projects/${r._id}` },
                { key: "clients",  label: "Clients",  icon: Users,        path: (r) => `/clients/${r._id}` },
                { key: "tasks",    label: "Tasks",     icon: CheckSquare,  path: (r) => `/projects/${r.projectId}` },
              ].map(({ key, label, icon: Icon, path }) =>
                results[key]?.length > 0 ? (
                  <div key={key}>
                    <p className="px-4 py-1.5 text-2xs font-semibold text-ink-muted uppercase tracking-wider">{label}</p>
                    {results[key].map((r) => (
                      <button key={r._id} onClick={() => go(path(r))}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-secondary dark:hover:bg-dark-muted transition-colors text-left">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand/10 flex items-center justify-center shrink-0">
                          <Icon size={13} className="text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink dark:text-slate-200 truncate">{r.title || r.name}</p>
                          {r.status && <Badge status={r.status} className="mt-0.5" />}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null
              )}
            </div>

            <div className="px-4 py-2 border-t border-surface-border dark:border-dark-border text-2xs text-ink-muted flex gap-4">
              <span><kbd className="font-medium">↵</kbd> open</span>
              <span><kbd className="font-medium">esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
