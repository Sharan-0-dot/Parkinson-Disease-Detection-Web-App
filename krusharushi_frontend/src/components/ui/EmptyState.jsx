export default function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-3 rounded-full bg-ink-100 p-3 text-ink-400">
          <Icon size={24} />
        </div>
      )}
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
