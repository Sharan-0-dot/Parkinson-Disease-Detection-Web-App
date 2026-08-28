import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { getPatient, updatePatient } from "../api/patients";
import { getApiErrorMessage } from "../api/axiosClient";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Skeleton from "../components/ui/Skeleton";
import PatientForm from "../components/patients/PatientForm";

export default function EditPatientPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;
    getPatient(id)
      .then((data) => active && setPatient(data))
      .catch((err) => active && setLoadError(getApiErrorMessage(err, "Couldn't load this patient.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError("");
    try {
      await updatePatient(id, values);
      toast.success("Patient updated");
      navigate(`/patients/${id}`);
    } catch (err) {
      setFormError(
        err.response?.status === 409
          ? "That patient code is already in use at your hospital. Choose a different code."
          : getApiErrorMessage(err, "Couldn't save changes — please try again.")
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="text-2xl font-semibold text-ink-900">Edit patient</h1>
        <p className="mt-1 text-sm text-ink-500">Update this patient's record.</p>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        ) : loadError ? (
          <Alert variant="error">{loadError}</Alert>
        ) : (
          <>
            {formError && (
              <Alert variant="error" className="mb-4">
                {formError}
              </Alert>
            )}
            <PatientForm
              defaultValues={{
                full_name: patient.full_name,
                patient_code: patient.patient_code,
                age: patient.age,
                gender: patient.gender,
              }}
              onSubmit={onSubmit}
              submitting={submitting}
              submitLabel="Save changes"
              onCancel={() => navigate(`/patients/${id}`)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
