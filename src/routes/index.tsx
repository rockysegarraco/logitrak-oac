import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Info,
  Search,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  X,
} from "lucide-react";
import { TwButton, TwInput, twButtonClass } from "@/components/ui/tw";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  listExhibitors,
  updateExhibitor,
  type Exhibitor,
  type ExhibitorInput,
} from "@/lib/exhibitors.functions";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import { cn } from "@/lib/utils";

const FILTER_FIELDS = EXHIBITOR_FIELDS.filter(
  (field) => field.key !== "exhibitor_name" && field.key !== "booth_number",
);

const PAGE_SIZES = [10, 25, 50, 100];

const exhibitorsQuery = queryOptions({
  queryKey: ["exhibitors"],
  queryFn: () => listExhibitors(),
});

type FieldKey = (typeof EXHIBITOR_FIELDS)[number]["key"];

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

function toInput(row: Exhibitor): ExhibitorInput {
  return {
    exhibitor_name: row.exhibitor_name ?? "",
    booth_number: row.booth_number ?? "",
    paf_in_files: row.paf_in_files ?? "",
    request_for_paf_sent: row.request_for_paf_sent ?? "",
    on_time_quote_sent: row.on_time_quote_sent ?? "",
    on_time_charges_processed: row.on_time_charges_processed ?? "",
    late_fee_quote_sent: row.late_fee_quote_sent ?? "",
    receiver_numbers_on_time: row.receiver_numbers_on_time ?? "",
    receiver_numbers_late: row.receiver_numbers_late ?? "",
  };
}

function TrackerPage() {
  const { data: exhibitors } = useSuspenseQuery(exhibitorsQuery);
  const router = useRouter();
  const queryClient = useQueryClient();
  const update = useServerFn(updateExhibitor);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: FieldKey; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExhibitorInput | null>(null);

  const term = search.trim().toLowerCase();
  const activeFilters = Object.entries(filters).filter(([, value]) => value && value !== "all");

  const rows = useMemo(() => {
    const filtered = exhibitors.filter((row) => {
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

    if (!sort) return filtered;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = (a[sort.key] ?? "").trim();
      const bv = (b[sort.key] ?? "").trim();
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" }) * factor;
    });
  }, [exhibitors, term, JSON.stringify(activeFilters), sort]);

  const hasFilters = activeFilters.length > 0 || term.length > 0;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [term, JSON.stringify(activeFilters), pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  const saveMutation = useMutation({
    mutationFn: (values: ExhibitorInput & { id: string }) => update({ data: values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitors"] });
      toast.success("Row updated");
      setEditingId(null);
      setDraft(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const startEdit = (row: Exhibitor) => {
    setEditingId(row.id);
    setDraft(toInput(row));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!editingId || !draft) return;
    if (!draft.exhibitor_name.trim()) {
      toast.error("Exhibitor name is required.");
      return;
    }
    saveMutation.mutate({ ...draft, id: editingId });
  };

  const toggleSort = (key: FieldKey) =>
    setSort((prev) =>
      prev?.key !== key ? { key, dir: "asc" } : prev.dir === "asc" ? { key, dir: "desc" } : null,
    );

  return (
    <TooltipProvider delayDuration={150}>
    <main className="min-h-screen bg-background">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-foreground">
              Exhibitor Shipping Tracker
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Showing {rows.length} of {exhibitors.length} exhibitor
              {exhibitors.length === 1 ? "" : "s"}. Click a header to sort, or edit a row inline.
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
          <div className="block min-w-full align-middle">
            <div className="rounded-lg bg-card shadow-sm ring-1 ring-border">
              <div className="max-h-[70vh] overflow-x-auto overflow-y-auto rounded-t-lg md:overflow-x-hidden">
                <table className="w-full min-w-[1100px] divide-y divide-border md:min-w-0 md:table-fixed">
                  <thead>
                    <tr className="divide-x divide-border">
                      {EXHIBITOR_FIELDS.map((field, index) => {
                        const active = sort?.key === field.key;
                        return (
                          <th
                            key={field.key}
                            scope="col"
                            aria-sort={
                              active
                                ? sort!.dir === "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                            className={cn(
                              "sticky top-0 z-10 bg-muted px-3 py-3.5 text-left text-sm font-semibold whitespace-nowrap text-foreground backdrop-blur md:whitespace-normal",
                              index === 0 && "pl-4 sm:pl-6",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSort(field.key)}
                              className="group inline-flex items-center gap-1.5"
                              title={field.label}
                            >
                              <span className="uppercase tracking-wide">{field.short}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    role="img"
                                    aria-label={field.label}
                                    onClick={(event) => event.stopPropagation()}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>{field.label}</TooltipContent>
                              </Tooltip>
                              <span
                                className={cn(
                                  "rounded text-muted-foreground",
                                  !active && "invisible group-hover:visible",
                                )}
                              >
                                {active ? (
                                  sort!.dir === "asc" ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-4 w-4" />
                                )}
                              </span>
                            </button>
                          </th>
                        );
                      })}
                      <th
                        scope="col"
                        className="sticky top-0 z-10 bg-muted px-3 py-3.5 pr-4 text-right text-sm font-semibold whitespace-nowrap text-foreground sm:pr-6"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {pageRows.map((row) => {
                      const editing = editingId === row.id;
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "divide-x divide-border",
                            !editing && "hover:bg-muted/60",
                          )}
                        >
                          {EXHIBITOR_FIELDS.map((field, index) => (
                            <td
                              key={field.key}
                              className={cn(
                                "px-3 py-2 text-sm break-words text-muted-foreground",
                                index === 0 && "pl-4 font-medium text-foreground sm:pl-6",
                              )}
                            >
                              {editing && draft ? (
                                <TwInput
                                  value={draft[field.key]}
                                  aria-label={field.label}
                                  maxLength={500}
                                  onChange={(event) =>
                                    setDraft({ ...draft, [field.key]: event.target.value })
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") saveEdit();
                                    if (event.key === "Escape") cancelEdit();
                                  }}
                                  className="min-w-32 py-1 md:min-w-0"
                                />
                              ) : (
                                row[field.key] || (
                                  <span className="text-muted-foreground/50">—</span>
                                )
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 pr-4 text-right text-sm whitespace-nowrap sm:pr-6">
                            {editing ? (
                              <div className="flex justify-end gap-2">
                                <TwButton
                                  onClick={saveEdit}
                                  disabled={saveMutation.isPending}
                                  className="px-2 py-1"
                                >
                                  <Check className="h-4 w-4" />
                                  Save
                                </TwButton>
                                <TwButton
                                  variant="secondary"
                                  onClick={cancelEdit}
                                  className="px-2 py-1"
                                >
                                  Cancel
                                </TwButton>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <TwButton
                                  variant="secondary"
                                  className="px-2 py-1"
                                  onClick={() => startEdit(row)}
                                  aria-label={`Quick edit ${row.exhibitor_name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </TwButton>
                                <TwButton
                                  variant="ghost"
                                  className="px-2 py-1"
                                  aria-label={`Open ${row.exhibitor_name}`}
                                  onClick={() =>
                                    router.navigate({
                                      to: "/exhibitor/$id",
                                      params: { id: row.id },
                                    })
                                  }
                                >
                                  <SquareArrowOutUpRight className="h-4 w-4" />
                                </TwButton>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {pageRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={EXHIBITOR_FIELDS.length + 1}
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

              <nav
                  aria-label="Pagination"
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 sm:px-6"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <label htmlFor="page-size">Rows per page</label>
                    <select
                      id="page-size"
                      value={pageSize}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                      className="rounded-md bg-card py-1 pr-7 pl-2 text-sm text-foreground outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rows.length === 0 ? (
                      "No results"
                    ) : (
                      <>
                        Showing <span className="font-medium text-foreground">{start + 1}</span> to{" "}
                        <span className="font-medium text-foreground">
                          {Math.min(start + pageSize, rows.length)}
                        </span>{" "}
                        of <span className="font-medium text-foreground">{rows.length}</span>
                      </>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <TwButton
                      variant="secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </TwButton>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {pageCount}
                    </span>
                    <TwButton
                      variant="secondary"
                      disabled={page >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      Next
                    </TwButton>
                  </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </main>
    </TooltipProvider>
  );
}
