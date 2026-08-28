import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Upload, Mic as MicIcon, ArrowLeft } from "lucide-react";
import { uploadVoiceSample, getPrediction } from "../api/voice";
import { getApiErrorMessage } from "../api/axiosClient";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import VoiceRecorder from "../components/voice/VoiceRecorder";
import PredictionResult from "../components/voice/PredictionResult";

const TABS = [
  { id: "record", label: "Record", icon: MicIcon },
  { id: "upload", label: "Upload file", icon: Upload },
];

export default function RecordVoicePage() {
  const { id: patientId } = useParams();
  const [tab, setTab] = useState("record");
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | processing | done
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");

  const activeFile = tab === "record" ? recordedBlob : uploadedFile;
  const busy = status === "submitting" || status === "processing";

  const reset = () => {
    setStatus("idle");
    setPrediction(null);
    setRecordedBlob(null);
    setUploadedFile(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!activeFile) return;
    setStatus("submitting");
    setError("");
    try {
      const file =
        tab === "record"
          ? new File([activeFile], "sample.webm", { type: "audio/webm" })
          : activeFile;

      const sample = await uploadVoiceSample(
        patientId,
        file,
        tab === "record" ? "recorded" : "uploaded"
      );

      setStatus("processing");
      // The upload endpoint returns the prediction inline; the fetch fallback
      // (keyed by sample_id) covers any future async-scoring change.
      const result = sample.prediction ?? (await getPrediction(sample.sample_id));
      setPrediction(result);
      setStatus("done");
      toast.success("Screening complete");
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't process the sample — please try again."));
      setStatus("idle");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          to={`/patients/${patientId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft size={15} /> Back to patient
        </Link>
        <h1 className="text-2xl font-semibold text-ink-900">New screening</h1>
        <p className="mt-1 text-sm text-ink-500">
          Record a live sample or upload an existing audio file for this patient.
        </p>
      </div>

      {status === "done" && prediction ? (
        <div className="space-y-4">
          <PredictionResult prediction={prediction} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={reset}>
              Record another
            </Button>
            <Link to={`/patients/${patientId}`}>
              <Button variant="ghost">Back to patient</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                disabled={busy}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                  tab === id ? "bg-white text-clinic-700 shadow-sm" : "text-ink-500 hover:text-ink-700"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {tab === "record" ? (
            <VoiceRecorder onRecorded={setRecordedBlob} />
          ) : (
            <Card>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Audio file
              </label>
              <input
                type="file"
                accept="audio/*"
                disabled={busy}
                onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-ink-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-clinic-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-clinic-700 hover:file:bg-clinic-100"
              />
              {uploadedFile && (
                <audio
                  controls
                  src={URL.createObjectURL(uploadedFile)}
                  className="mt-3 w-full"
                />
              )}
            </Card>
          )}

          {busy ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink-500">
              <Spinner className="h-4 w-4" />
              {status === "submitting" ? "Uploading sample…" : "Running screening model…"}
            </div>
          ) : (
            <Button onClick={handleSubmit} disabled={!activeFile} className="w-full">
              Submit for screening
            </Button>
          )}
        </>
      )}
    </div>
  );
}
