import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { createPatient } from "../api/patients";
import { getApiErrorMessage } from "../api/axiosClient";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import PatientForm from "../components/patients/PatientForm";

export default function NewPatientPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError("");
    try {
      const patient = await createPatient(values);
      toast.success("Patient registered");
      navigate(`/patients/${patient.id}`);
    } catch (err) {
      setFormError(
        err.response?.status === 409
          ? "That patient code is already in use at your hospital. Choose a different code."
          : getApiErrorMessage(err, "Couldn't register patient — please try again.")
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
        <h1 className="text-2xl font-semibold text-ink-900">Register patient</h1>
        <p className="mt-1 text-sm text-ink-500">
          Add a new patient to your hospital's records.
        </p>
      </div>

      <Card>
        {formError && (
          <Alert variant="error" className="mb-4">
            {formError}
          </Alert>
        )}
        <PatientForm
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel="Register patient"
          onCancel={() => navigate(-1)}
        />
      </Card>
    </div>
  );
}
