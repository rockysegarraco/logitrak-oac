import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronRight, Pencil, Search, Trash2, X } from "lucide-react";
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
  updateDirectoryEntry,
} from "@/lib/exhibitor-directory.functions";
import { listExhibitors } from "@/lib/exhibitors.functions";

export const Route = createFileRoute("/_authenticated/shows")({
  head: () => ({
    meta: [
      { title: "Show List | FreightTRAK" },
      {
        name: "description",
        content:
          "Maintain the master list of shows available when creating a new shipment record.",
      },
      { property: "og:title", content: "Show List | FreightTRAK" },
      {
        property: "og:description",
        content:
          "Maintain the master list of shows available when creating a new shipment record.",
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
  const rename = useServerFn(updateDirectoryEntry);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const { data: records } = useQuery({
    queryKey: ["exhibitors"],
    queryFn: () => listExhibitors(),
  });

  const term = search.trim().toLowerCase();
  const showsWithMatchingExhibitor = useMemo(() => {
    const set = new Set<string>();
    if (!term) return set;
    for (const row of records ?? []) {
      if ((row.exhibitor_name ?? "").toLowerCase().includes(term)) {
        set.add((row.show_name ?? "").trim().toLowerCase());
      }
    }
    return set;
  }, [records, term]);

  const visibleEntries = useMemo(() => {
    const list = entries ?? [];
    if (!term) return list;
    return list.filter(
      (entry) =>
        entry.name.toLowerCase().includes(term) ||
        showsWithMatchingExhibitor.has(entry.name.trim().toLowerCase()),
    );
  }, [entries, term, showsWithMatchingExhibitor]);

  const addMutation = useMutation({
    mutationFn: () => add({ data: { name } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitor-directory"] });
      toast.success("Show added to the list");
      setName("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const renameMutation = useMutation({
    mutationFn: () => rename({ data: { id: editing!.id, name: editing!.name } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitor-directory"] });
      await queryClient.invalidateQueries({ queryKey: ["exhibitors"] });
      toast.success("Show renamed");
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitor-directory"] });
      toast.success("Show removed from the list");
      setPendingDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Shows</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add shows here first. They then show up in the dropdown when you create a new
          shipment record. Click a show to see its shipment records.
        </p>

        <form
          className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError("Enter a show name.");
              return;
            }
            addMutation.mutate();
          }}
        >
          <div className="flex-1">
            <TwLabel htmlFor="new-exhibitor">Show name</TwLabel>
            <div className="mt-2">
              <TwInput
                id="new-exhibitor"
                value={name}
                placeholder="EXPO WEST 2026"
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
            {addMutation.isPending ? "Adding..." : "Add show"}
          </TwButton>
        </form>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <TwInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shows or exhibitor names"
            aria-label="Search shows"
            className="w-full pl-9"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading shows...</p>
          ) : (entries ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No shows yet. Add your first one above.
            </p>
          ) : visibleEntries.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No shows match "{search.trim()}".
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visibleEntries.map((entry, index) => (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-3 ${index % 2 === 1 ? "bg-muted/40" : ""}`}
                >
                  {editing?.id === entry.id ? (
                    <form
                      className="flex min-w-0 flex-1 items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!editing.name.trim()) {
                          toast.error("Enter a show name.");
                          return;
                        }
                        renameMutation.mutate();
                      }}
                    >
                      <TwInput
                        autoFocus
                        value={editing.name}
                        maxLength={200}
                        aria-label={`Rename ${entry.name}`}
                        className="uppercase"
                        onChange={(event) =>
                          setEditing({ id: entry.id, name: event.target.value.toUpperCase() })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setEditing(null);
                        }}
                      />
                      <button
                        type="submit"
                        aria-label="Save name"
                        disabled={renameMutation.isPending}
                        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel rename"
                        onClick={() => setEditing(null)}
                        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <Link
                        to="/"
                        search={{ show: entry.name }}
                        className="group flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold uppercase text-foreground hover:underline"
                        title={`View ${entry.name} records`}
                      >
                        <Num caseMode="upper">{entry.name}</Num>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Rename ${entry.name}`}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setEditing({ id: entry.id, name: entry.name })}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${entry.name}`}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                        disabled={removeMutation.isPending}
                        onClick={() => setPendingDelete({ id: entry.id, name: entry.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove show?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from the show list and will no longer
              appear in the Create New dropdown.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) removeMutation.mutate(pendingDelete.id);
              }}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
