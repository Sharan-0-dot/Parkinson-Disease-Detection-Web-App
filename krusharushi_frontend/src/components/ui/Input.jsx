import { forwardRef } from "react";

const base =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-clinic-500/30 focus:border-clinic-500 disabled:bg-ink-50 disabled:text-ink-400";

const Input = forwardRef(function Input(
  { className = "", invalid = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${base} ${invalid ? "border-rose-300" : "border-ink-200"} ${className}`}
      {...props}
    />
  );
});

export default Input;
