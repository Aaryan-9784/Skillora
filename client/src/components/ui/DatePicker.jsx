import { forwardRef, useRef, useImperativeHandle } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { formatDate } from "../../utils/helpers";

const DatePicker = forwardRef(({
  label,
  error,
  hint,
  value = "",
  onChange,
  placeholder = "Select deadline...",
  className = "",
  disabled = false,
  name,
  required,
  min,
  max,
  ...props
}, ref) => {
  const internalInputRef = useRef(null);

  useImperativeHandle(ref, () => internalInputRef.current);

  const openPicker = () => {
    if (disabled) return;
    try {
      if (internalInputRef.current && typeof internalInputRef.current.showPicker === "function") {
        internalInputRef.current.showPicker();
      } else {
        internalInputRef.current?.focus();
      }
    } catch {
      internalInputRef.current?.focus();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    if (onChange) {
      const syntheticEvent = {
        target: { name: name || "", value: "" },
        currentTarget: { name: name || "", value: "" },
        value: "",
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(syntheticEvent);
    }
  };

  const formattedDisplay = value ? formatDate(value) : "";

  return (
    <div className={`w-full relative group ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-300 mb-1.5 dark:text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div
        onClick={openPicker}
        className={`relative flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 text-left cursor-pointer select-none ${
          disabled
            ? "opacity-50 bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed"
            : error
            ? "bg-slate-900/80 border-rose-500/80 text-white"
            : "bg-slate-900/80 border-slate-700/80 text-white group-hover:border-slate-600 group-focus-within:border-indigo-500/80 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20"
        }`}
      >
        <div className="flex items-center gap-2 truncate pointer-events-none">
          {value ? (
            <span className="text-white font-semibold truncate">{formattedDisplay}</span>
          ) : (
            <span className="text-slate-500 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 z-30">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="p-0.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
          <CalendarIcon size={14} className="text-slate-400 pointer-events-none" />
        </div>

        {/* Real hidden date input */}
        <input
          ref={internalInputRef}
          type="date"
          name={name}
          value={value || ""}
          onChange={(e) => onChange && onChange(e)}
          required={required}
          min={min}
          max={max}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-pointer z-10 [color-scheme:dark]"
          {...props}
        />
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-rose-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
});

DatePicker.displayName = "DatePicker";
export default DatePicker;
