import { forwardRef } from "react";
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

      <div className="relative flex items-center w-full">
        {/* Visually rendered styled background & placeholder/formatted date */}
        <div
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 text-left ${
            disabled
              ? "opacity-50 bg-slate-900/50 border-slate-800 text-slate-500"
              : error
              ? "bg-slate-900/80 border-rose-500/80 text-white"
              : "bg-slate-900/80 border-slate-700/80 text-white group-hover:border-slate-600 group-focus-within:border-indigo-500/80 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {value ? (
              <span className="text-white font-semibold truncate">{formattedDisplay}</span>
            ) : (
              <span className="text-slate-500 font-normal truncate">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 z-10">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear date"
                className="relative z-30 p-0.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
            <CalendarIcon size={14} className="text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Real date input layered on top with opacity-0 so clicking anywhere opens calendar */}
        <input
          ref={ref}
          type="date"
          name={name}
          value={value || ""}
          onChange={(e) => onChange && onChange(e)}
          required={required}
          min={min}
          max={max}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [color-scheme:dark]"
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
