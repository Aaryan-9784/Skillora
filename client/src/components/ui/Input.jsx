import { forwardRef } from "react";

const Input = forwardRef(({ label, error, hint, className = "", prefix, suffix, size = "md", ...props }, ref) => {
  const sizeClass = size === "lg" ? "input-lg" : "input";
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-ink-muted pointer-events-none">{prefix}</span>
        )}
        <input
          ref={ref}
          className={`${sizeClass} ${error ? "input-error" : ""} ${prefix ? "pl-9" : ""} ${suffix ? "pr-9" : ""} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-ink-muted pointer-events-none">{suffix}</span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
