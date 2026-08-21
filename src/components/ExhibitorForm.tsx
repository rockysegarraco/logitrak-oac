import { useState } from "react";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import type { ExhibitorInput } from "@/lib/exhibitors.functions";
import { toSentenceCase } from "@/lib/text-case";
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
      Object.entries(initialValues).map(([k, v]) => [k, toSentenceCase(v ?? "")]),
    ) as ExhibitorInput,
  );
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof ExhibitorInput, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, v.trim()]),
        ) as ExhibitorInput;
        if (!trimmed.exhibitor_name) {
          setError("Exhibitor name is required.");
          return;
        }
        setError(null);
        onSubmit(trimmed);
      }}
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
        {EXHIBITOR_FIELDS.map((field) => (
          <div
            key={field.key}
            className={cn("sm:col-span-3", field.wide && "sm:col-span-6")}
          >
            <TwLabel htmlFor={field.key}>{field.label}</TwLabel>
            <div className="mt-2">
              <TwInput
                id={field.key}
                value={values[field.key]}
                placeholder={field.placeholder}
                maxLength={500}
                onChange={(event) => set(field.key, event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-x-4 border-t border-border pt-6">
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
