export default function Card({
  children,
  className = "",
  hover = false,
  as: Tag = "div",
  ...props
}) {
  return (
    <Tag
      className={`rounded-xl border border-ink-100 bg-white p-6 shadow-card ${
        hover ? "transition-shadow hover:shadow-card-hover" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
