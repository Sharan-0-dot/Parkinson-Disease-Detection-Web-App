// Shimmer-animated placeholder block (keyframes live in index.css).
export default function Skeleton({ className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-ink-100 ${className}`}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{ animation: "shimmer 1.5s infinite" }}
      />
    </div>
  );
}
