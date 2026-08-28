import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

const config = {
  error: {
    icon: XCircle,
    cls: "bg-rose-50 text-rose-800 border-rose-200",
    iconCls: "text-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    cls: "bg-amber-50 text-amber-800 border-amber-200",
    iconCls: "text-amber-500",
  },
  success: {
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconCls: "text-emerald-500",
  },
  info: {
    icon: Info,
    cls: "bg-clinic-50 text-clinic-800 border-clinic-200",
    iconCls: "text-clinic-600",
  },
};

export default function Alert({ variant = "info", title, children, action, className = "" }) {
  const { icon: Icon, cls, iconCls } = config[variant] ?? config.info;
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-3.5 text-sm ${cls} ${className}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${iconCls}`} />
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
