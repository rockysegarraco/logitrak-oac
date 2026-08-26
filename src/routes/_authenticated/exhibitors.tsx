import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Trash2 } from "lucide-react";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import { Num } from "@/components/Num";
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
import {
  createDirectoryEntry,
  deleteDirectoryEntry,
  listDirectory,
} from "@/lib/exhibitor-directory.functions";

export const Route = createFileRoute("/_authenticated/exhibitors")({
  head: () => ({
    meta: [
      { title: "Exhibitor List | FreightTRAK" },
      {
        name: "description",
        content:
          "Maintain the master list of exhibitors available when creating a new shipment record.",
      },
      { property: "og:title", content: "Exhibitor List | FreightTRAK" },
      {
        property: "og:description",
        content:
          "Maintain the master list of exhibitors available when creating a new shipment record.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExhibitorsPage,
});

export const directoryQuery = queryOptions({
  queryKey: ["exhibitor-directory"],
  queryFn: () => listDirectory(),
});

function ExhibitorsPage() {
  const queryClient = useQueryClient();
  const { data: entries, isLoading } = useQuery(directoryQuery);
  const add = useServerFn(createDirectoryEntry);
  const remove = useServerFn(deleteDirectoryEntry);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const addMutation = useMutation({
    mutationFn: () => add({ data: { name } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitor-directory"] });
      toast.success("Exhibitor added to the list");
      setName("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitor-directory"] });
      toast.success("Exhibitor removed from the list");
      setPendingDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Exhibitors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add exhibitors here first. They then show up in the dropdown when you create a new
          shipment record. Click an exhibitor to see its shipment records.
        </p>

        <form
          className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError("Enter an exhibitor name.");
              return;
            }
            addMutation.mutate();
          }}
        >
          <div className="flex-1">
            <TwLabel htmlFor="new-exhibitor">Exhibitor name</TwLabel>
            <div className="mt-2">
              <TwInput
                id="new-exhibitor"
                value={name}
                placeholder="SKYLINE EXHIBITS"
                maxLength={200}
                className="uppercase"
                aria-invalid={error ? true : undefined}
                onChange={(event) => {
                  setName(event.target.value.toUpperCase());
                  setError(null);
                }}
              />
            </div>
          </div>
          <TwButton type="submit" variant="primary" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Adding..." : "Add exhibitor"}
          </TwButton>
        </form>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading exhibitors...</p>
          ) : (entries ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No exhibitors yet. Add your first one above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(entries ?? []).map((entry, index) => (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-3 ${index % 2 === 1 ? "bg-muted/40" : ""}`}
                >
                  <Link
                    to="/"
                    search={{ exhibitor: entry.name }}
                    className="group flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold uppercase text-foreground hover:underline"
                    title={`View ${entry.name} records`}
                  >
                    <Num caseMode="upper">{entry.name}</Num>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {entry.created_by_initials}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.name}`}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => setPendingDelete({ id: entry.id, name: entry.name })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
