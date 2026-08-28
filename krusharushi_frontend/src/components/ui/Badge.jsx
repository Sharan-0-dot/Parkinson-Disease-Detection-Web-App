const tones = {
  neutral: "bg-ink-100 text-ink-700",
  elevated: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  low: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  info: "bg-clinic-50 text-clinic-700 ring-1 ring-clinic-100",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        tones[tone] ?? tones.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
