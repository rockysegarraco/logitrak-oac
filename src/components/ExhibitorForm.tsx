import { useState } from "react";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import type { ExhibitorInput } from "@/lib/exhibitors.functions";
import { normalizeValue } from "@/lib/text-case";
import { cn } from "@/lib/utils";

type Props = {
  initialValues: ExhibitorInput;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: ExhibitorInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
  deletePending?: boolean;
};

const REQUIRED_FIELDS: (keyof ExhibitorInput)[] = ["exhibitor_name"];

export function ExhibitorForm({
  initialValues,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  onDelete,
  deletePending,
}: Props) {
  const [values, setValues] = useState<ExhibitorInput>(() =>
    Object.fromEntries(
      Object.entries(initialValues).map(([k, v]) => [k, normalizeValue(v ?? "")]),
    ) as ExhibitorInput,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ExhibitorInput, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: keyof ExhibitorInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const next: Partial<Record<keyof ExhibitorInput, string>> = {};
    for (const field of EXHIBITOR_FIELDS) {
      const raw = values[field.key] ?? "";
      const trimmed = raw.trim();
      if (!trimmed && REQUIRED_FIELDS.includes(field.key)) {
        next[field.key] = `${field.label} is required.`;
      } else if (raw.length > 0 && !trimmed) {
        next[field.key] = `${field.label} can't be only spaces.`;
      }
    }
    return next;
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const found = validate();
        if (Object.keys(found).length > 0) {
          setErrors(found);
          setFormError("Please fix the highlighted fields before saving.");
          return;
        }
        const trimmed = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, normalizeValue(v ?? "")]),
        ) as ExhibitorInput;
        setErrors({});
        setFormError(null);
        onSubmit(trimmed);
      }}
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
        {EXHIBITOR_FIELDS.map((field) => {
          const error = errors[field.key];
          const required = REQUIRED_FIELDS.includes(field.key);
          return (
            <div
              key={field.key}
              className={cn("sm:col-span-3", field.wide && "sm:col-span-6")}
            >
              <TwLabel htmlFor={field.key}>
                {field.label}
                {required ? <span className="ml-1 text-destructive">*</span> : null}
              </TwLabel>
              <div className="mt-2">
                <TwInput
                  id={field.key}
                  value={values[field.key]}
                  placeholder={field.placeholder}
                  maxLength={500}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${field.key}-error` : undefined}
                  className={cn(
                    "uppercase",
                    error && "outline-destructive focus:outline-destructive",
                  )}
                  onChange={(event) => set(field.key, event.target.value.toUpperCase())}
                  onBlur={(event) => set(field.key, normalizeValue(event.target.value))}
                />
              </div>
              {error ? (
                <p id={`${field.key}-error`} className="mt-1 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {formError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 -mb-6 mt-8 flex items-center gap-x-4 border-t border-border bg-background px-4 py-4 sm:-mx-6 sm:px-6">
        <TwButton type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </TwButton>
        <TwButton variant="ghost" onClick={onCancel}>
          Cancel
        </TwButton>
        {onDelete ? (
          <TwButton
            variant="danger"
            className="ml-auto"
            disabled={deletePending}
            onClick={() => {
              if (confirm("Delete this exhibitor row? This cannot be undone.")) onDelete();
            }}
          >
            {deletePending ? "Deleting..." : "Delete"}
          </TwButton>
        ) : null}
      </div>
    </form>
  );
}
