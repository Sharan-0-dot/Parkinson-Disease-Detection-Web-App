import Badge from "../ui/Badge";
import { interpretPrediction } from "../../lib/format";

/**
 * Renders a single screening result: a plain-language risk label, a confidence
 * meter, and the standing "screening aid, not a diagnosis" disclaimer.
 * `prediction` is the backend PredictionOut shape.
 */
export default function PredictionResult({ prediction }) {
  if (!prediction) return null;

  const { label, tone, elevated, confidence } = interpretPrediction(
    prediction.predicted_class,
    prediction.probability_score
  );
  const meterColor = elevated ? "bg-rose-500" : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={tone}>{label}</Badge>
          <p className="mt-2 text-sm text-ink-500">
            Model confidence · {prediction.model_version}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums text-ink-900">
            {confidence}%
          </div>
          <p className="text-xs text-ink-400">confidence</p>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={`h-full rounded-full ${meterColor} transition-all duration-500`}
          style={{ width: `${confidence}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-ink-400">
        This is a screening aid, not a diagnosis. Elevated-risk results should be
        followed up with a clinical evaluation.
      </p>
    </div>
  );
}
