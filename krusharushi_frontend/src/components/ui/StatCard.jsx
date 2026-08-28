import Card from "./Card";
import Skeleton from "./Skeleton";

const tones = {
  clinic: "bg-clinic-50 text-clinic-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

export default function StatCard({ icon: Icon, label, value, loading = false, tone = "clinic" }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`rounded-xl p-3 ${tones[tone] ?? tones.clinic}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <p className="text-2xl font-semibold text-ink-900">{value}</p>
        )}
        <p className="mt-0.5 text-sm text-ink-500">{label}</p>
      </div>
    </Card>
  );
}
