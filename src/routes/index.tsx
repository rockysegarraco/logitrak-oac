import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { TwButton, TwInput, twButtonClass } from "@/components/ui/tw";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-foreground">
              Exhibitor Shipping Tracker
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Showing {rows.length} of {exhibitors.length} exhibitor
              {exhibitors.length === 1 ? "" : "s"}. Click a row to edit it.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-0 sm:ml-16 sm:flex-none">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <TwInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search all columns"
                className="w-64 pl-9"
                aria-label="Search exhibitors"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <TwButton variant="secondary">
                  <SlidersHorizontal className="-ml-0.5 h-4 w-4" />
                  Filters
                  {activeFilters.length > 0 ? (
                    <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {activeFilters.length}
                    </span>
                  ) : null}
                </TwButton>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
                <SheetHeader className="border-b border-border">
                  <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    Narrow the list by which steps are completed.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
                  {FILTER_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label
                        htmlFor={`filter-${field.key}`}
                        className="block text-sm/6 font-medium text-foreground"
                      >
                        {field.label}
                      </label>
                      <select
                        id={`filter-${field.key}`}
                        value={filters[field.key] ?? "all"}
                        onChange={(event) =>
                          setFilters((prev) => ({ ...prev, [field.key]: event.target.value }))
                        }
                        className="mt-2 block w-full rounded-md bg-card py-1.5 pr-8 pl-3 text-base text-foreground outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
                      >
                        <option value="all">Any</option>
                        <option value="done">Completed</option>
                        <option value="pending">Not done</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 border-t border-border px-4 py-4">
                  <TwButton
                    variant="secondary"
                    className="flex-1"
                    disabled={!hasFilters}
                    onClick={() => {
                      setFilters({});
                      setSearch("");
                    }}
                  >
                    <X className="-ml-0.5 h-4 w-4" />
                    Clear all
                  </TwButton>
                  <SheetClose asChild>
                    <TwButton className="flex-1">Show {rows.length} results</TwButton>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/new" className={twButtonClass("primary")}>
              <Plus className="-ml-0.5 h-4 w-4" />
              Add exhibitor
            </Link>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border">
                <table className="w-full min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      {EXHIBITOR_FIELDS.map((field, index) => (
                        <th
                          key={field.key}
                          scope="col"
                          className={cn(
                            "px-3 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-foreground",
                            index === 0 && "pl-4 sm:pl-6",
                          )}
                        >
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
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
                        className="cursor-pointer transition-colors hover:bg-muted/60"
                      >
                        {EXHIBITOR_FIELDS.map((field, index) => (
                          <td
                            key={field.key}
                            className={cn(
                              "px-3 py-4 text-sm text-muted-foreground",
                              index === 0 && "pl-4 font-medium text-foreground sm:pl-6",
                            )}
                          >
                            {row[field.key] || <span className="text-muted-foreground/50">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={EXHIBITOR_FIELDS.length}
                          className="px-3 py-12 text-center text-sm text-muted-foreground"
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
