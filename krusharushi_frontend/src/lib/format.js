// Shared display helpers so risk labels and date formatting stay consistent
// across the dashboard, patient list, detail view, and screening result.

export function interpretPrediction(predictedClass, probability) {
  const p = probability ?? 0;
  const elevated = predictedClass === 1;
  const riskPct = Math.round(p * 100); // model's P(elevated)
  // Confidence is expressed in the predicted class, so "Low risk" reads as a
  // high number rather than the inverted (and confusing) elevated probability.
  const confidence = elevated ? riskPct : 100 - riskPct;
  return {
    label: elevated ? "Elevated risk" : "Low risk",
    tone: elevated ? "elevated" : "low",
    elevated,
    riskPct,
    confidence,
  };
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}
