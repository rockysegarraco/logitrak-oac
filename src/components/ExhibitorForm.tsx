import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXHIBITOR_FIELDS, TONE_ACCENT } from "@/lib/exhibitor-fields";
import type { ExhibitorInput } from "@/lib/exhibitors.functions";
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
  const [values, setValues] = useState<ExhibitorInput>(initialValues);
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
      className="space-y-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {EXHIBITOR_FIELDS.map((field) => (
          <div
            key={field.key}
            className={cn("space-y-2", field.wide && "sm:col-span-2")}
          >
            <Label htmlFor={field.key} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className={cn("h-3 w-1.5 rounded-full", TONE_ACCENT[field.tone])} />
              {field.label}
            </Label>
            <Input
              id={field.key}
              value={values[field.key]}
              placeholder={field.placeholder}
              maxLength={500}
              onChange={(event) => set(field.key, event.target.value)}
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {onDelete ? (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            disabled={deletePending}
            onClick={() => {
              if (confirm("Delete this exhibitor row? This cannot be undone.")) onDelete();
            }}
          >
            {deletePending ? "Deleting..." : "Delete"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
