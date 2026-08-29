import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import { listDirectory } from "@/lib/exhibitor-directory.functions";
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

const REQUIRED_FIELDS: (keyof ExhibitorInput)[] = EXHIBITOR_FIELDS.map(
  (field) => field.key,
) as (keyof ExhibitorInput)[];


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

  const { data: directory, isLoading: directoryLoading } = useQuery({
    queryKey: ["exhibitor-directory"],
    queryFn: () => listDirectory(),
  });
  const options = directory ?? [];
  const picked = (values.show_name ?? "").trim().length > 0;


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
      className="flex min-h-0 flex-1 flex-col"
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mb-6">
        <TwLabel htmlFor="show_name">
          Show
          <span className="ml-1 text-destructive">*</span>
        </TwLabel>
        <div className="relative mt-2">

          <select
            id="show_name"
            value={values.show_name ?? ""}
            aria-invalid={errors.show_name ? true : undefined}
            onChange={(event) => set("show_name", event.target.value)}
            className={cn(
              "block h-10 w-full cursor-pointer appearance-none rounded-full border border-input bg-card px-4 pr-10 text-sm uppercase text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
              errors.show_name && "border-destructive focus:border-destructive focus:ring-destructive/30",
            )}

          >
            <option value="">
              {directoryLoading
                ? "Loading shows..."
                : options.length === 0
  ? "No shows added yet"
                  : "Select a show..."}
            </option>
            {options.map((entry) => (
              <option key={entry.id} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {errors.show_name ? (
          <p className="mt-1 text-sm text-destructive">{errors.show_name}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a show to fill in the rest.{" "}
          <Link to="/shows" className="font-semibold text-foreground underline">
            Manage show list
          </Link>
        </p>
      </div>

      <div
        aria-hidden={!picked}
        className={cn(
          "grid grid-cols-1 gap-x-6 gap-y-6 transition-opacity sm:grid-cols-6",
          !picked && "pointer-events-none opacity-50",
        )}
      >
        {EXHIBITOR_FIELDS.filter((field) => field.key !== "show_name").map((field) => {
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
                  disabled={!picked}
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
      </div>

      <div className="flex w-full shrink-0 items-center gap-x-4 border-t border-border bg-card px-4 py-4 sm:px-6">
        <TwButton type="submit" variant="primary" disabled={pending || !picked}>
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
