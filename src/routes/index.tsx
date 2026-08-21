import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listExhibitors } from "@/lib/exhibitors.functions";
import { EXHIBITOR_FIELDS, TONE_HEADER } from "@/lib/exhibitor-fields";
import { cn } from "@/lib/utils";

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

  const term = search.trim().toLowerCase();
  const rows = term
    ? exhibitors.filter(
        (row) =>
          row.exhibitor_name.toLowerCase().includes(term) ||
          row.booth_number.toLowerCase().includes(term),
      )
    : exhibitors;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Exhibitor Shipping Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {exhibitors.length} exhibitor{exhibitors.length === 1 ? "" : "s"} tracked. Click a
              row to edit it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or booth"
                className="w-56 pl-9"
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

        <section className="mt-8 overflow-hidden rounded-lg border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr>
                  {EXHIBITOR_FIELDS.map((field) => (
                    <th
                      key={field.key}
                      scope="col"
                      className={cn(
                        "border border-background/20 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide",
                        TONE_HEADER[field.tone],
                      )}
                    >
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
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
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-accent",
                      index % 2 === 1 && "bg-sheet-row/40",
                    )}
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
                        : "No exhibitors match that search."}
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
