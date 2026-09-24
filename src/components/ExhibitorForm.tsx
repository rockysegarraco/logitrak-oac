import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import { listDirectory } from "@/lib/exhibitor-directory.functions";
import { listExhibitors, type ExhibitorInput } from "@/lib/exhibitors.functions";
import { normalizeValue } from "@/lib/text-case";
import { cn } from "@/lib/utils";

type Props = {
  initialValues: ExhibitorInput;
  submitLabel: string;
  pending?: boolean;
  currentId?: string | undefined;
  onSubmit: (values: ExhibitorInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
  deletePending?: boolean;
};

const REQUIRED_FIELDS: (keyof ExhibitorInput)[] = ["show_name"];

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];



export function ExhibitorForm({
  initialValues,
  submitLabel,
  pending,
  currentId,
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
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const { data: directory, isLoading: directoryLoading } = useQuery({
    queryKey: ["exhibitor-directory"],
    queryFn: () => listDirectory(),
  });
  const { data: existing } = useQuery({
    queryKey: ["exhibitors"],
    queryFn: () => listExhibitors(),
  });
  const options = directory ?? [];
  const picked = (values.show_name ?? "").trim().length > 0;

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const set = (key: keyof ExhibitorInput, value: string) => {
    setDirty(true);
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const fieldError = (key: keyof ExhibitorInput, raw: string) => {
    const trimmed = raw.trim();
    if (!REQUIRED_FIELDS.includes(key)) return null;
    const label = EXHIBITOR_FIELDS.find((f) => f.key === key)?.label ?? "This field";
    if (!trimmed) return `${label} is required.`;
    if (raw.length > 0 && !trimmed) return `${label} can't be only spaces.`;
    return null;
  };

  const validate = () => {
    const next: Partial<Record<keyof ExhibitorInput, string>> = {};
    for (const field of EXHIBITOR_FIELDS) {
      const message = fieldError(field.key, values[field.key] ?? "");
      if (message) next[field.key] = message;
    }
    if (!next.show_name && (values.exhibitor_name ?? "").trim()) {
      const key = (v: string) => v.trim().toLowerCase();
      const duplicate = (existing ?? []).find(
        (row) =>
          row.id !== currentId &&
          key(row.show_name ?? "") === key(values.show_name ?? "") &&
          key(row.exhibitor_name ?? "") === key(values.exhibitor_name ?? "") &&
          key(row.booth_number ?? "") === key(values.booth_number ?? ""),
      );
      if (duplicate) {
        next.exhibitor_name =
          "This exhibitor already exists for that show and booth.";
      }
    }
    return next;
  };

  const requestCancel = () => {
    if (dirty) {
      setConfirmLeave(true);
      return;
    }
    onCancel();
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
          toast.error(
            found.exhibitor_name?.startsWith("This exhibitor already exists")
              ? found.exhibitor_name
              : "Please complete all required fields.",
          );
          return;
        }
        const trimmed = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, normalizeValue(v ?? "")]),
        ) as ExhibitorInput;
        setErrors({});
        setFormError(null);
        setDirty(false);
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
              <div className="relative mt-2">
                {field.key === "state" ? (
                  <>
                    <select
                      id="state"
                      value={values.state ?? ""}
                      disabled={!picked}
                      aria-invalid={error ? true : undefined}
                      onChange={(event) => set("state", event.target.value)}
                      className={cn(
                        "block h-10 w-full cursor-pointer appearance-none rounded-full border border-input bg-card px-4 pr-10 text-sm uppercase text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
                        error && "border-destructive",
                      )}
                    >
                      <option value="">Select a state...</option>
                      {values.state && !US_STATES.includes(values.state) ? (
                        <option value={values.state}>{values.state}</option>
                      ) : null}
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </>
                ) : (
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
                  onBlur={(event) => {
                    const clean = normalizeValue(event.target.value);
                    set(field.key, clean);
                    const message = fieldError(field.key, clean);
                    setErrors((prev) => {
                      const next = { ...prev };
                      if (message) next[field.key] = message;
                      else delete next[field.key];
                      return next;
                    });
                  }}

                />
                )}
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
        <TwButton variant="ghost" onClick={requestCancel}>
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

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on this form. Leaving now will discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmLeave(false);
                setDirty(false);
                onCancel();
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>

  );
}
