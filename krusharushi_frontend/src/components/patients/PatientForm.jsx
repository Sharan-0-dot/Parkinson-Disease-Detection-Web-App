import { useForm } from "react-hook-form";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

/**
 * Shared create/edit form for patients. `onSubmit` receives normalized values
 * ({ full_name, patient_code, age:Number, gender }).
 */
export default function PatientForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
        <Input
          id="full_name"
          autoComplete="off"
          invalid={!!errors.full_name}
          {...register("full_name", { required: "Full name is required" })}
        />
      </Field>

      <Field
        label="Patient code (MRN)"
        htmlFor="patient_code"
        hint="Your hospital's own record number — must be unique within your hospital."
        error={errors.patient_code?.message}
      >
        <Input
          id="patient_code"
          autoComplete="off"
          invalid={!!errors.patient_code}
          {...register("patient_code", { required: "Patient code is required" })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Age" htmlFor="age" error={errors.age?.message}>
          <Input
            id="age"
            type="number"
            min="0"
            max="120"
            invalid={!!errors.age}
            {...register("age", {
              required: "Age is required",
              valueAsNumber: true,
              min: { value: 0, message: "Enter a valid age" },
              max: { value: 120, message: "Enter a valid age" },
            })}
          />
        </Field>

        <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
          <Select
            id="gender"
            invalid={!!errors.gender}
            {...register("gender", { required: "Gender is required" })}
          >
            <option value="">Select…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
