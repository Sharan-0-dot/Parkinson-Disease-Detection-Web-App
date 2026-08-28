import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";
import Button from "../ui/Button";

const CAPTURE_SECONDS = 5;

/**
 * Mirrors the "say a sustained aaah for 5 seconds" protocol from the
 * original script's countdown -> record -> auto-stop flow, but capture
 * happens in the browser via MediaRecorder (the backend never touches
 * a mic directly — see backend_context.md §6).
 *
 * onRecorded(blob) fires once a take is ready to preview/submit.
 */
export default function VoiceRecorder({ onRecorded }) {
  const [phase, setPhase] = useState("idle"); // idle | countdown | recording | done
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCountdown = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch {
      alert("Microphone access is required to record a sample.");
      return;
    }

    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(id);
        beginRecording();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  const beginRecording = () => {
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setPreviewUrl(URL.createObjectURL(blob));
      onRecorded(blob);
      setPhase("done");
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };

    recorderRef.current = recorder;
    recorder.start();
    setPhase("recording");
    setElapsed(0);

    // Drive the countdown from a closure-local counter and call stopRecording
    // from the interval callback — never as a side effect inside a setState
    // updater (which would fire twice under StrictMode and can double-stop).
    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds += 1;
      setElapsed(seconds);
      if (seconds >= CAPTURE_SECONDS) {
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setPhase("idle");
    setElapsed(0);
    onRecorded(null);
  };

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-6 text-center">
      {phase === "idle" && (
        <>
          <p className="mb-4 text-sm text-ink-600">
            Ask the patient to say a sustained <span className="font-medium">"aaah"</span>{" "}
            for {CAPTURE_SECONDS} seconds when recording starts.
          </p>
          <Button onClick={startCountdown}>
            <Mic size={16} /> Start recording
          </Button>
        </>
      )}

      {phase === "countdown" && (
        <div className="py-6">
          <p className="text-sm text-ink-500">Get ready…</p>
          <p className="text-5xl font-semibold text-clinic-700">{countdown}</p>
        </div>
      )}

      {phase === "recording" && (
        <div className="py-4">
          <div className="mb-3 flex items-center justify-center gap-2 text-rose-600">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" />
            <span className="text-sm font-medium">
              Recording · {elapsed}s / {CAPTURE_SECONDS}s
            </span>
          </div>
          <Button variant="secondary" onClick={stopRecording}>
            <Square size={14} /> Stop early
          </Button>
        </div>
      )}

      {phase === "done" && previewUrl && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-ink-700">
            Preview the recording before submitting
          </p>
          <audio controls src={previewUrl} className="mx-auto w-full max-w-xs" />
          <Button variant="ghost" onClick={reset}>
            <RotateCcw size={14} /> Record again
          </Button>
        </div>
      )}
    </div>
  );
}