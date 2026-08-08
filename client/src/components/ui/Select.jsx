import { forwardRef, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";

const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  value,
  onChange,
  placeholder = "Select option...",
  className = "",
  disabled = false,
  name,
  required,
  searchable = false,
  prefix,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  // Normalize options array into object format { value, label, icon, description }
  const normalizedOptions = (options || []).map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.label,
        label: opt.label !== undefined ? opt.label : opt.value,
        icon: opt.icon,
        description: opt.description,
      };
    }
    return { value: opt, label: opt };
  });

  const selectedOpt = normalizedOptions.find((o) => String(o.value) === String(value));

  useClickOutside(containerRef, () => setIsOpen(false), { enabled: isOpen });

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (disabled) return;
    setIsOpen(false);
    setSearch("");
    if (onChange) {
      const syntheticEvent = {
        target: { name: name || "", value: optValue },
        currentTarget: { name: name || "", value: optValue },
        value: optValue,
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(syntheticEvent);
    }
  };

  const filteredOptions = searchable && search.trim()
    ? normalizedOptions.filter((o) => String(o.label).toLowerCase().includes(search.toLowerCase()))
    : normalizedOptions;

  return (
    <div ref={containerRef} className={`w-full relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-300 mb-1.5 dark:text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      {/* Hidden select element for form ref and native accessibility */}
      <select
        ref={ref}
        name={name}
        value={value || ""}
        onChange={(e) => onChange && onChange(e)}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {normalizedOptions.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Custom Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 cursor-pointer text-left ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-900/50 border-slate-800 text-slate-500"
            : isOpen
            ? "bg-slate-900/90 border-indigo-500/80 text-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20"
            : error
            ? "bg-slate-900/80 border-rose-500/80 text-white"
            : "bg-slate-900/80 border-slate-700/80 text-white hover:border-slate-600 hover:bg-slate-900"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {prefix && <span className="text-slate-400 shrink-0">{prefix}</span>}
          {selectedOpt ? (
            <span className="truncate text-white font-semibold flex items-center gap-2">
              {selectedOpt.icon && <selectedOpt.icon size={14} className="text-indigo-400 shrink-0" />}
              {selectedOpt.label}
            </span>
          ) : (
            <span className="text-slate-500 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-400" : ""}`}
        />
      </button>

      {/* Error & Hint Messages */}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              background: "linear-gradient(160deg, rgba(15, 23, 42, 0.98) 0%, rgba(8, 14, 26, 0.98) 100%)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 91, 255, 0.15)",
            }}
          >
            {/* Top Shimmer line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            {/* Optional Search Bar */}
            {searchable && (
              <div className="p-2 border-b border-white/10">
                <div className="relative flex items-center">
                  <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950/80 text-white placeholder-slate-500 border border-slate-800 outline-none focus:border-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="p-1.5 max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-center text-slate-500">
                  No options available
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  const Icon = opt.icon;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/30 text-indigo-200 font-bold border border-indigo-500/30"
                          : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {Icon && <Icon size={14} className={isSelected ? "text-indigo-300" : "text-slate-400"} />}
                        <div className="truncate text-left">
                          <div className="truncate">{opt.label}</div>
                          {opt.description && (
                            <div className="text-[10px] font-normal text-slate-400 truncate">{opt.description}</div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="text-indigo-400 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Select.displayName = "Select";
export default Select;
