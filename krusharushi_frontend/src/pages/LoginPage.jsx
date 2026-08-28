import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api/axiosClient";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async ({ username, password }) => {
    setSubmitting(true);
    setFormError("");
    try {
      await login(username, password);
      toast.success("Signed in");
      navigate("/dashboard");
    } catch (err) {
      setFormError(
        err.response?.status === 401
          ? "Incorrect username or password."
          : err.response
          ? getApiErrorMessage(err, "Couldn't sign in. Please try again.")
          : "Couldn't reach the server — check the backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex flex-col items-center gap-2 text-clinic-700">
          <div className="rounded-2xl bg-clinic-600 p-3 text-white shadow-card">
            <Activity size={28} strokeWidth={2.2} />
          </div>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">Voice Screening</h1>
          <p className="text-sm text-ink-500">Hospital staff sign-in</p>
        </Link>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {formError && <Alert variant="error">{formError}</Alert>}

            <Field label="Username" htmlFor="username" error={errors.username?.message}>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                invalid={!!errors.username}
                {...register("username", { required: "Username is required" })}
              />
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={!!errors.password}
                {...register("password", { required: "Password is required" })}
              />
            </Field>

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-ink-500">
          New here?{" "}
          <Link to="/signup" className="font-medium text-clinic-700 hover:underline">
            Register your hospital
          </Link>
        </p>
      </div>
    </div>
  );
}
