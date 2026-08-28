import { Link } from "react-router-dom";
import {
  Activity,
  Mic,
  LineChart,
  ShieldCheck,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice-based screening",
    body: "Capture a short sustained vowel from the patient — recorded live in the browser or uploaded — and let the model do the rest.",
  },
  {
    icon: LineChart,
    title: "Instant risk scoring",
    body: "Each sample is scored in seconds and returned as a plain-language risk label with a confidence meter your staff can act on.",
  },
  {
    icon: ShieldCheck,
    title: "Private by hospital",
    body: "Every patient, recording, and result is scoped to your hospital. Staff only ever see their own organisation's data.",
  },
];

const STEPS = [
  { n: "1", title: "Register your hospital", body: "Create an account and your admin login in under a minute." },
  { n: "2", title: "Add your patients", body: "Keep a tidy roster with your own record numbers." },
  { n: "3", title: "Record & screen", body: "Capture a voice sample and get an immediate risk read-out." },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white text-ink-900">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-clinic-700">
            <Activity size={22} strokeWidth={2.2} />
            <span className="font-semibold tracking-tight">Voice Screening</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm">
                  Go to dashboard <ArrowRight size={15} />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-clinic-50 to-white" />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-clinic-100 px-3 py-1 text-xs font-medium text-clinic-700">
            <Activity size={13} /> Parkinson's voice screening for hospitals
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Catch the signs earlier, from a{" "}
            <span className="text-clinic-700">few seconds of voice</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500">
            A screening aid that turns a short voice recording into an instant,
            easy-to-read risk indicator — so your team can decide who needs a closer look.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="md">
                  Go to dashboard <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="md">
                    Register your hospital <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="md">
                    Log in
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-ink-400">
            A clinical decision-support aid — not a diagnosis.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} hover>
              <div className="mb-3 inline-flex rounded-xl bg-clinic-50 p-3 text-clinic-700">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold text-ink-900">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-center text-2xl font-semibold text-ink-900">
          Up and running in three steps
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map(({ n, title, body }) => (
            <div key={n} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-clinic-600 font-semibold text-white">
                {n}
              </div>
              <h3 className="mt-3 font-semibold text-ink-900">{title}</h3>
              <p className="mt-1 text-sm text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      {!isAuthenticated && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-clinic-600 px-8 py-10 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3 text-white">
              <Building2 size={28} className="shrink-0 opacity-90" />
              <div>
                <h2 className="text-xl font-semibold">Bring voice screening to your hospital</h2>
                <p className="mt-1 text-sm text-clinic-50/90">
                  Create your organisation's account and invite your team.
                </p>
              </div>
            </div>
            <Link to="/signup" className="shrink-0">
              <Button variant="secondary" size="md">
                Get started <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-ink-400 sm:flex-row">
          <div className="flex items-center gap-1.5 text-ink-500">
            <Activity size={14} className="text-clinic-600" /> Voice Screening
          </div>
          <p>For clinical screening support only. Not a substitute for medical diagnosis.</p>
        </div>
      </footer>
    </div>
  );
}
