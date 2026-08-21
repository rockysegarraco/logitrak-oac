import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listExhibitors } from "@/lib/exhibitors.functions";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import { cn } from "@/lib/utils";

const FILTER_FIELDS = EXHIBITOR_FIELDS.filter(
  (field) => field.key !== "exhibitor_name" && field.key !== "booth_number",
);

const exhibitorsQuery = queryOptions({
  queryKey: ["exhibitors"],
  queryFn: () => listExhibitors(),
});


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Exhibitor Shipping Tracker" },
      {
        name: "description",
        content:
          "Track exhibitor booths, PAF paperwork, quotes, shipment charges, and receiver numbers in one shared list.",
      },
      { property: "og:title", content: "Exhibitor Shipping Tracker" },
      {
        property: "og:description",
        content:
          "Track exhibitor booths, PAF paperwork, quotes, shipment charges, and receiver numbers in one shared list.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(exhibitorsQuery);
  },
  component: TrackerPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-xl p-10 text-center" role="alert">
      <h1 className="text-lg font-semibold">Couldn't load the tracker</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Nothing here.</div>,
});

function TrackerPage() {
  const { data: exhibitors } = useSuspenseQuery(exhibitorsQuery);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const term = search.trim().toLowerCase();
  const activeFilters = Object.entries(filters).filter(([, value]) => value && value !== "all");

  const rows = exhibitors.filter((row) => {
    if (
      term &&
      !EXHIBITOR_FIELDS.some((field) => (row[field.key] ?? "").toLowerCase().includes(term))
    ) {
      return false;
    }
    return activeFilters.every(([key, value]) => {
      const filled = (row[key as keyof typeof row] as string | null)?.trim();
      return value === "done" ? Boolean(filled) : !filled;
    });
  });

  const hasFilters = activeFilters.length > 0 || term.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Exhibitor Shipping Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing {rows.length} of {exhibitors.length} exhibitor
              {exhibitors.length === 1 ? "" : "s"}. Click a row to edit it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search all columns"
                className="w-64 pl-9"
                aria-label="Search exhibitors"
              />
            </div>
            <Button asChild>
              <Link to="/new">
                <Plus className="mr-1 h-4 w-4" />
                Add Exhibitor
              </Link>
            </Button>
          </div>
        </header>

        <section className="mt-6 rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-wrap items-end gap-3">
            {FILTER_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <label
                  htmlFor={`filter-${field.key}`}
                  className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {field.label}
                </label>
                <Select
                  value={filters[field.key] ?? "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, [field.key]: value }))
                  }
                >
                  <SelectTrigger id={`filter-${field.key}`} className="h-9 w-44 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="done">Completed</SelectItem>
                    <SelectItem value="pending">Not done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setFilters({});
                  setSearch("");
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  {EXHIBITOR_FIELDS.map((field) => (
                    <th
                      key={field.key}
                      scope="col"
                      className="border px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    role="button"
                    onClick={() =>
                      router.navigate({ to: "/exhibitor/$id", params: { id: row.id } })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        router.navigate({ to: "/exhibitor/$id", params: { id: row.id } });
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-accent"
                  >
                    {EXHIBITOR_FIELDS.map((field) => (
                      <td
                        key={field.key}
                        className={cn(
                          "border px-3 py-2 align-top",
                          field.key === "exhibitor_name" && "font-medium",
                        )}
                      >
                        {row[field.key] || (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={EXHIBITOR_FIELDS.length}
                      className="border px-3 py-12 text-center text-muted-foreground"
                    >
                      {exhibitors.length === 0
                        ? "No exhibitors yet — add your first one."
                        : "No exhibitors match your search or filters."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

