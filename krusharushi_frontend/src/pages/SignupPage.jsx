import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { registerHospital } from "../api/auth";
import { getApiErrorMessage } from "../api/axiosClient";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { isAuthenticated, establishSession } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError("");
    try {
      // Only send optional fields when filled — the backend validates
      // contact_email as a real address, so "" would be rejected.
      const payload = {
        hospital_name: values.hospital_name.trim(),
        admin_username: values.admin_username.trim(),
        admin_password: values.admin_password,
      };
      if (values.hospital_address?.trim()) {
        payload.hospital_address = values.hospital_address.trim();
      }
      if (values.contact_email?.trim()) {
        payload.contact_email = values.contact_email.trim();
      }

      const { access_token } = await registerHospital(payload);
      establishSession(access_token);
      toast.success("Hospital registered");
      navigate("/dashboard");
    } catch (err) {
      setFormError(
        err.response?.status === 400
          ? "That username is already taken. Try another."
          : err.response
          ? getApiErrorMessage(err, "Couldn't create your account. Please try again.")
          : "Couldn't reach the server — check the backend is running."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex flex-col items-center gap-2 text-clinic-700">
          <div className="rounded-2xl bg-clinic-600 p-3 text-white shadow-card">
            <Activity size={28} strokeWidth={2.2} />
          </div>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">Register your hospital</h1>
          <p className="text-sm text-ink-500">Create your organisation's account</p>
        </Link>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {formError && <Alert variant="error">{formError}</Alert>}

            <Field
              label="Hospital name"
              htmlFor="hospital_name"
              error={errors.hospital_name?.message}
            >
              <Input
                id="hospital_name"
                autoComplete="organization"
                invalid={!!errors.hospital_name}
                {...register("hospital_name", { required: "Hospital name is required" })}
              />
            </Field>

            <Field
              label="Address"
              htmlFor="hospital_address"
              hint="Optional"
              error={errors.hospital_address?.message}
            >
              <Input id="hospital_address" autoComplete="street-address" {...register("hospital_address")} />
            </Field>

            <Field
              label="Contact email"
              htmlFor="contact_email"
              hint="Optional"
              error={errors.contact_email?.message}
            >
              <Input
                id="contact_email"
                type="email"
                autoComplete="email"
                invalid={!!errors.contact_email}
                {...register("contact_email", {
                  validate: (v) =>
                    !v || EMAIL_RE.test(v) || "Enter a valid email address",
                })}
              />
            </Field>

            <div className="border-t border-ink-100 pt-4">
              <p className="mb-3 text-sm font-medium text-ink-700">Admin account</p>

              <div className="space-y-4">
                <Field
                  label="Username"
                  htmlFor="admin_username"
                  error={errors.admin_username?.message}
                >
                  <Input
                    id="admin_username"
                    autoComplete="username"
                    invalid={!!errors.admin_username}
                    {...register("admin_username", { required: "Username is required" })}
                  />
                </Field>

                <Field
                  label="Password"
                  htmlFor="admin_password"
                  error={errors.admin_password?.message}
                >
                  <Input
                    id="admin_password"
                    type="password"
                    autoComplete="new-password"
                    invalid={!!errors.admin_password}
                    {...register("admin_password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Use at least 8 characters" },
                    })}
                  />
                </Field>

                <Field
                  label="Confirm password"
                  htmlFor="confirm_password"
                  error={errors.confirm_password?.message}
                >
                  <Input
                    id="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    invalid={!!errors.confirm_password}
                    {...register("confirm_password", {
                      required: "Please confirm your password",
                      validate: (v) => v === getValues("admin_password") || "Passwords don't match",
                    })}
                  />
                </Field>
              </div>
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-clinic-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
