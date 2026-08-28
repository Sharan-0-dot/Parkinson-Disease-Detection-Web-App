import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mic, Pencil, Trash2, ArrowLeft, History } from "lucide-react";
import { getPatient, deletePatient } from "../api/patients";
import { getApiErrorMessage } from "../api/axiosClient";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import PredictionResult from "../components/voice/PredictionResult";
import { interpretPrediction, formatDateTime } from "../lib/format";

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(() => {
    return getPatient(id)
      .then((data) => {
        setPatient(data);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load this patient.")))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reload = () => {
    setLoading(true);
    setError("");
    fetchData();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePatient(id);
      toast.success("Patient deleted");
      navigate("/patients");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't delete this patient."));
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft size={15} /> Back to patients
        </Link>
        <Alert
          variant="error"
          title="Something went wrong"
          action={
            <Button size="sm" variant="secondary" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error || "Patient not found."}
        </Alert>
      </div>
    );
  }

  const samples = patient.voice_samples ?? [];
  const latest = samples.find((s) => s.prediction);

  return (
    <div className="space-y-6">
      <Link
        to="/patients"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft size={15} /> Back to patients
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{patient.full_name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {patient.patient_code} · Age {patient.age} ·{" "}
            <span className="capitalize">{patient.gender}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/patients/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil size={15} /> Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
          >
            <Trash2 size={15} /> Delete
          </Button>
          <Link to={`/patients/${id}/record`}>
            <Button size="sm">
              <Mic size={15} /> New screening
            </Button>
          </Link>
        </div>
      </div>

      {confirmOpen && (
        <Alert
          variant="warning"
          title="Delete this patient?"
          action={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleDelete} loading={deleting}>
                Delete
              </Button>
            </div>
          }
        >
          This permanently removes {patient.full_name} and all {samples.length} associated
          screening{samples.length === 1 ? "" : "s"}. This can't be undone.
        </Alert>
      )}

      {latest ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-700">Latest result</h2>
          <PredictionResult prediction={latest.prediction} />
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Mic}
            title="No screenings yet"
            description="Record or upload a voice sample to generate this patient's first screening result."
            action={
              <Link to={`/patients/${id}/record`}>
                <Button size="sm">
                  <Mic size={15} /> New screening
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink-900">
          <History size={16} className="text-ink-400" /> Screening history
        </h2>
        {samples.length === 0 ? (
          <p className="py-2 text-sm text-ink-500">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {samples.map((s) => {
              const result = s.prediction
                ? interpretPrediction(
                    s.prediction.predicted_class,
                    s.prediction.probability_score
                  )
                : null;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="text-ink-600">
                    <span className="font-medium text-ink-800">
                      {formatDateTime(s.created_at)}
                    </span>
                    <span className="ml-2 capitalize text-ink-400">{s.source}</span>
                    {s.duration_seconds != null && (
                      <span className="ml-2 text-ink-400">
                        · {s.duration_seconds.toFixed(1)}s
                      </span>
                    )}
                  </div>
                  {result ? (
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-ink-500">
                        {result.confidence}%
                      </span>
                      <Badge tone={result.tone}>{result.label}</Badge>
                    </div>
                  ) : (
                    <Badge tone="pending">Processing</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
