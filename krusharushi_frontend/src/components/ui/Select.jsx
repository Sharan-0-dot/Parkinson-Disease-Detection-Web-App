import { forwardRef } from "react";

const base =
  "w-full appearance-none rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-clinic-500/30 focus:border-clinic-500 disabled:bg-ink-50 disabled:text-ink-400";

const Select = forwardRef(function Select(
  { className = "", invalid = false, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${base} ${invalid ? "border-rose-300" : "border-ink-200"} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
