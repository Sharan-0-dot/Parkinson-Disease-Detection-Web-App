import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Mic, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { listPatients, getHospitalStats } from "../api/patients";
import { getApiErrorMessage } from "../api/axiosClient";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import Alert from "../components/ui/Alert";
import { interpretPrediction, formatDate } from "../lib/format";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(() => {
    // setState lives only inside the promise callbacks (never synchronously in
    // this function's body), so calling it from the effect can't cascade renders.
    return Promise.all([getHospitalStats(), listPatients()])
      .then(([statsData, patientsData]) => {
        setStats(statsData);
        setPatients(patientsData);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load your dashboard.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reload = () => {
    setLoading(true);
    setError("");
    fetchData();
  };

  const recent = patients.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          Overview of screenings for your hospital.
        </p>
      </div>

      {error ? (
        <Alert
          variant="error"
          title="Something went wrong"
          action={
            <Button size="sm" variant="secondary" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Registered patients"
              value={stats?.total_patients ?? 0}
              loading={loading}
              tone="clinic"
            />
            <StatCard
              icon={Mic}
              label="Total screenings"
              value={stats?.total_screenings ?? 0}
              loading={loading}
              tone="clinic"
            />
            <StatCard
              icon={TrendingUp}
              label="Samples this week"
              value={stats?.samples_this_week ?? 0}
              loading={loading}
              tone="emerald"
            />
            <StatCard
              icon={AlertTriangle}
              label="Elevated-risk flags"
              value={stats?.elevated_flags ?? 0}
              loading={loading}
              tone="rose"
            />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Recent patients</h2>
              <Link
                to="/patients"
                className="inline-flex items-center gap-1 text-sm font-medium text-clinic-700 hover:underline"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No patients yet"
                description="Register your first patient to start recording voice screenings."
                action={
                  <Link to="/patients/new">
                    <Button size="sm">Register a patient</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {recent.map((p) => {
                  const result = p.latest_prediction
                    ? interpretPrediction(
                        p.latest_prediction.predicted_class,
                        p.latest_prediction.probability_score
                      )
                    : null;
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/patients/${p.id}`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 text-sm hover:bg-ink-50"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium text-ink-800">
                          {p.full_name}
                          <span className="ml-2 font-normal text-ink-400">
                            {p.patient_code}
                          </span>
                        </span>
                        <span className="hidden text-xs text-ink-400 sm:block">
                          {p.last_screened_at
                            ? `Screened ${formatDate(p.last_screened_at)}`
                            : "No screenings"}
                        </span>
                        {result ? (
                          <Badge tone={result.tone}>{result.label}</Badge>
                        ) : (
                          <Badge tone="neutral">Not screened</Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
