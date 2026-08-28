import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, Users, SearchX } from "lucide-react";
import { listPatients } from "../api/patients";
import { getApiErrorMessage } from "../api/axiosClient";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import Alert from "../components/ui/Alert";
import { interpretPrediction, formatDate } from "../lib/format";

const COLUMNS = ["Name", "Patient code", "Age", "Gender", "Screenings", "Last screened", "Latest result"];

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const fetchData = useCallback(() => {
    return listPatients()
      .then((data) => {
        setPatients(data);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load patients.")))
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

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.patient_code?.toLowerCase().includes(q)
    );
  }, [patients, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Patients</h1>
          <p className="mt-1 text-sm text-ink-500">
            {loading
              ? "Loading your hospital's records…"
              : `${patients.length} registered at your hospital.`}
          </p>
        </div>
        <Link to="/patients/new">
          <Button>
            <UserPlus size={16} /> New patient
          </Button>
        </Link>
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
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or patient code…"
              className="pl-9"
              disabled={!loading && patients.length === 0}
            />
          </div>

          <Card className="overflow-hidden p-0">
            {loading ? (
              <Table>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-ink-100">
                    {COLUMNS.map((c) => (
                      <td key={c} className="px-6 py-4">
                        <Skeleton className="h-4 w-full max-w-[8rem]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </Table>
            ) : patients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No patients yet"
                description="Register your first patient to begin recording voice screenings."
                action={
                  <Link to="/patients/new">
                    <Button size="sm">
                      <UserPlus size={15} /> New patient
                    </Button>
                  </Link>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matches"
                description={`No patients match "${query}".`}
                action={
                  <Button size="sm" variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <Table>
                {filtered.map((p) => {
                  const result = p.latest_prediction
                    ? interpretPrediction(
                        p.latest_prediction.predicted_class,
                        p.latest_prediction.probability_score
                      )
                    : null;
                  return (
                    <tr key={p.id} className="border-t border-ink-100 hover:bg-ink-50">
                      <td className="px-6 py-3">
                        <Link
                          to={`/patients/${p.id}`}
                          className="font-medium text-clinic-700 hover:underline"
                        >
                          {p.full_name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-ink-600">{p.patient_code}</td>
                      <td className="px-6 py-3 text-ink-600">{p.age}</td>
                      <td className="px-6 py-3 capitalize text-ink-600">{p.gender}</td>
                      <td className="px-6 py-3 tabular-nums text-ink-600">
                        {p.screening_count ?? 0}
                      </td>
                      <td className="px-6 py-3 text-ink-500">
                        {p.last_screened_at ? formatDate(p.last_screened_at) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {result ? (
                          <Badge tone={result.tone}>{result.label}</Badge>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink-50/60 text-left text-ink-500">
            {COLUMNS.map((c) => (
              <th key={c} className="whitespace-nowrap px-6 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
