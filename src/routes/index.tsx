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
  Inbox,
  Search,
  SearchX,
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
import { Num } from "@/components/Num";
import { normalizeValue, type ValueCase } from "@/lib/text-case";
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
  const [headerMode, setHeaderMode] = useState<"short" | "full">("short");
  const [valueCase, setValueCase] = useState<ValueCase>("upper");

  useEffect(() => {
    const saved = localStorage.getItem("tracker:valueCase:v3");
    if (saved === "upper" || saved === "sentence") setValueCase(saved);
  }, []);

  const changeValueCase = (mode: ValueCase) => {
    setValueCase(mode);
    localStorage.setItem("tracker:valueCase:v3", mode);
  };

  const [openTip, setOpenTip] = useState<FieldKey | null>(null);

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
      const av = (a[sort.key] ?? "").trim().toLowerCase();
      const bv = (b[sort.key] ?? "").trim().toLowerCase();
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
    const trimmed = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, normalizeValue(v ?? "")]),
    ) as ExhibitorInput;
    if (!trimmed.exhibitor_name) {
      toast.error("Exhibitor name is required.");
      return;
    }
    saveMutation.mutate({ ...trimmed, id: editingId });
  };

  const toggleSort = (key: FieldKey) =>
    setSort((prev) =>
      prev?.key !== key ? { key, dir: "asc" } : prev.dir === "asc" ? { key, dir: "desc" } : null,
    );

  return (
    <TooltipProvider delayDuration={150}>
    <main className="min-h-screen bg-background">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <TwInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search all columns"
              className="w-full pl-9"
              aria-label="Search exhibitors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">

            <TwButton
              variant="secondary"
              aria-pressed={headerMode === "full"}
              onClick={() => setHeaderMode((m) => (m === "short" ? "full" : "short"))}
            >
              {headerMode === "short" ? "Show full names" : "Show acronyms"}
            </TwButton>
            <TwButton
              variant="secondary"
              aria-pressed={valueCase === "upper"}
              onClick={() => changeValueCase(valueCase === "upper" ? "sentence" : "upper")}
              title="Toggle how table values are capitalized"
            >
              {valueCase === "upper" ? "Sentence case values" : "UPPERCASE values"}
            </TwButton>
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
            <div className="rounded-t-lg rounded-b-none bg-card shadow-sm ring-1 ring-border">
              <div className="max-h-[70vh] overflow-x-auto overflow-y-auto rounded-t-lg md:overflow-x-hidden">
                <table className="w-full min-w-[1100px] table-auto divide-y divide-border md:min-w-0">
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
                              "sticky top-0 z-10 bg-muted px-3 py-3.5 text-left text-xs font-semibold whitespace-nowrap text-foreground md:whitespace-normal",
                              index === 0 && "pl-4 sm:pl-6",
                            )}
                          >
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleSort(field.key)}
                                className="group inline-flex items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                aria-label={`Sort by ${field.label}`}
                              >
                                <span
                                  className={cn(
                                    valueCase === "upper" && "uppercase",
                                    headerMode === "short" && "tracking-wide",
                                    headerMode === "full" && "md:whitespace-normal",
                                  )}
                                >
                                  {headerMode === "short" ? field.short : field.label}
                                </span>
                                <span
                                  className={cn(
                                    "rounded text-muted-foreground",
                                    !active &&
                                      "hidden group-hover:inline-flex group-focus-visible:inline-flex",
                                  )}
                                >
                                  {active ? (
                                    sort!.dir === "asc" ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )
                                  ) : (
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                  )}
                                </span>
                              </button>
                              {headerMode === "short" ? (
                                <Tooltip
                                  open={openTip === field.key}
                                  onOpenChange={(open) =>
                                    setOpenTip(open ? field.key : null)
                                  }
                                >
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label={`What is ${field.short}? ${field.label}`}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenTip((prev) =>
                                          prev === field.key ? null : field.key,
                                        );
                                      }}
                                      className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    >
                                      <Info className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                  </TooltipTrigger>

                                  <TooltipContent
                                    side="bottom"
                                    align="start"
                                    collisionPadding={12}
                                    className="max-w-[min(16rem,calc(100vw-2rem))] whitespace-normal break-words text-wrap"
                                  >
                                    {field.label}
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                            </div>
                          </th>
                        );
                      })}

                      <th
                        scope="col"
                        className={cn(
                          "sticky top-0 z-10 bg-muted px-3 py-3.5 pr-4 text-right text-sm font-semibold whitespace-nowrap text-foreground sm:pr-6",
                          valueCase === "upper" && "uppercase",
                        )}
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
                                "px-3 py-2 text-sm break-normal [overflow-wrap:normal] hyphens-none text-muted-foreground",
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
                              ) : row[field.key] ? (
                                <Num caseMode={valueCase} highlight={search}>
                                  {row[field.key]}
                                </Num>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
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
                          className="px-6 py-16 text-center"
                        >
                          {exhibitors.length === 0 ? (
                            <div className="mx-auto max-w-sm">
                              <Inbox
                                className="mx-auto h-10 w-10 text-muted-foreground/40"
                                aria-hidden="true"
                              />
                              <h3 className="mt-3 text-sm font-semibold text-foreground">
                                No exhibitors yet
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Add your first exhibitor to start tracking PAFs, quotes, and
                                receiver numbers.
                              </p>
                              <Link to="/new" className={cn(twButtonClass("primary"), "mt-5")}>
                                <Plus className="-ml-0.5 h-4 w-4" />
                                Add exhibitor
                              </Link>
                            </div>
                          ) : (
                            <div className="mx-auto max-w-sm">
                              <SearchX
                                className="mx-auto h-10 w-10 text-muted-foreground/40"
                                aria-hidden="true"
                              />
                              <h3 className="mt-3 text-sm font-semibold text-foreground">
                                No matching exhibitors
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                No records match your current search or filters. Try a different
                                term or clear the filters.
                              </p>
                              <TwButton
                                variant="secondary"
                                className="mt-5"
                                disabled={!hasFilters}
                                onClick={() => {
                                  setSearch("");
                                  setFilters({});
                                }}
                              >
                                <X className="-ml-0.5 h-4 w-4" />
                                Clear search and filters
                              </TwButton>
                            </div>
                          )}
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
                        Showing <span className="num font-medium text-foreground">{start + 1}</span> to{" "}
                        <span className="num font-medium text-foreground">
                          {Math.min(start + pageSize, rows.length)}
                        </span>{" "}
                        of <span className="num font-medium text-foreground">{rows.length}</span>
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
                      Page <span className="num">{page}</span> of <span className="num">{pageCount}</span>
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
