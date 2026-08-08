import { forwardRef } from "react";

const Input = forwardRef(({ label, error, hint, className = "", prefix, suffix, size = "md", required, ...props }, ref) => {
  const sizeClass = size === "lg" ? "input-lg" : "input";
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-200 dark:text-slate-200 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 text-slate-400 font-medium pointer-events-none text-xs">{prefix}</span>
        )}
        <input
          ref={ref}
          required={required}
          className={`${sizeClass} ${error ? "input-error" : ""} ${prefix ? "pl-8" : ""} ${suffix ? "pr-8" : ""} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3.5 text-slate-400 font-medium pointer-events-none text-xs">{suffix}</span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
