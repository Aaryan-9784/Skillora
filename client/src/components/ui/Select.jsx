import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(({ label, error, options = [], className = "", ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={`input appearance-none pr-9 cursor-pointer ${error ? "input-error" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
    </div>
    {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
  </div>
));

Select.displayName = "Select";
export default Select;
