import Spinner from "./Spinner";

const variants = {
  primary:
    "bg-clinic-600 text-white shadow-sm hover:bg-clinic-700 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none",
  secondary:
    "bg-white text-clinic-700 border border-clinic-200 hover:bg-clinic-50 disabled:text-ink-300 disabled:border-ink-200",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none",
  ghost: "text-ink-600 hover:bg-ink-100 disabled:text-ink-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Spinner inherits the button's text color via currentColor. */}
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
