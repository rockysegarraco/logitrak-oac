import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  queryOptions,
  useMutation,
  useQuery,
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
  Download,

  MoreHorizontal,
  Pencil,
  Plus,
  Info,
  Inbox,
  RefreshCw,
  Search,
  SearchX,
  Trash2,
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
  listExhibitors,
  updateExhibitor,
  deleteExhibitor,
  type Exhibitor,
  type ExhibitorInput,
} from "@/lib/exhibitors.functions";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import { getMe, listUsers } from "@/lib/users.functions";
import { Num } from "@/components/Num";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";


import { avatarTone, normalizeValue, type ValueCase } from "@/lib/text-case";
import { useOpenExhibitorCreate } from "@/lib/exhibitor-create-context";
import { cn } from "@/lib/utils";




const MONEY_FIELDS = ["actual_costs", "final_invoice", "actual_revenue"] as const;

function parseMoney(value: string | null | undefined) {
  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const exhibitorsQuery = queryOptions({
  queryKey: ["exhibitors"],
  queryFn: () => listExhibitors(),
});

const meQuery = queryOptions({ queryKey: ["me"], queryFn: () => getMe() });

const usersQuery = queryOptions({ queryKey: ["users"], queryFn: () => listUsers() });

function csvCell(value: string) {
  return `"${(value ?? "").replace(/"/g, '""')}"`;
}


type FieldKey = (typeof EXHIBITOR_FIELDS)[number]["key"];

function SkeletonRows({ rows, columns }: { rows: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={`skeleton-${index}`} className="divide-x divide-border">
          {Array.from({ length: columns }).map((__, cell) => (
            <td key={cell} className="px-3 py-3">
              <Skeleton className="h-4 w-full min-w-12" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TrackerSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <div className="mt-8 rounded-t-lg bg-card p-4 shadow-sm ring-1 ring-border">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: (search: Record<string, unknown>): { show?: string } => {
    const value = search['show'];
    return typeof value === "string" && value ? { show: value } : {};
  },

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
  pendingMs: 200,
  pendingComponent: TrackerSkeleton,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-xl p-10 text-center" role="alert">
      <h1 className="text-lg font-semibold">Couldn't load the tracker</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Nothing here.</div>,
});

function toInput(row: Exhibitor): ExhibitorInput {
  return Object.fromEntries(
    EXHIBITOR_FIELDS.map((field) => [field.key, row[field.key] ?? ""]),
  ) as ExhibitorInput;
}

function TrackerPage() {
  const { data: exhibitors } = useSuspenseQuery(exhibitorsQuery);
  const { data: me } = useQuery(meQuery);
  const isAdmin = Boolean(me?.isAdmin);
  const { data: allUsers } = useQuery({ ...usersQuery, enabled: isAdmin });
  const openCreate = useOpenExhibitorCreate();



  const queryClient = useQueryClient();
  const update = useServerFn(updateExhibitor);
  const remove = useServerFn(deleteExhibitor);


  const navigate = useNavigate();
  const { show: showParam } = Route.useSearch();
  const [search, setSearch] = useState("");
  const [exhibitorFilter, setExhibitorFilter] = useState(showParam ?? "all");

  useEffect(() => {
    setExhibitorFilter(showParam ?? "all");
  }, [showParam]);
  const [userFilter, setUserFilter] = useState("all");
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

  const [refreshing, setRefreshing] = useState(false);

  async function hardRefresh() {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["exhibitors"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.refetchQueries({ queryKey: ["exhibitors"] });
      toast.success("Data refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  const [openTip, setOpenTip] = useState<FieldKey | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Exhibitor | null>(null);
  const [draft, setDraft] = useState<ExhibitorInput | null>(null);

  const term = search.trim().toLowerCase();

  const userOptions = useMemo(() => {
    const byInitials = new Map<string, string>();
    for (const initials of exhibitors.map((row) => row.created_by_initials).filter(Boolean)) {
      byInitials.set(initials, initials);
    }
    for (const user of allUsers ?? []) {
      if (!user.initials) continue;
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
      byInitials.set(user.initials, fullName || user.username);
    }
    return Array.from(byInitials, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [exhibitors, allUsers]);

  const activeUserFilter = isAdmin ? userFilter : "all";

  const exhibitorOptions = useMemo(() => {
    const names = new Set<string>();
    for (const row of exhibitors) {
      const name = (row.show_name ?? "").trim();
      if (name) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [exhibitors]);

  const rows = useMemo(() => {
    const filtered = exhibitors.filter((row) => {
      if (
        term &&
        !EXHIBITOR_FIELDS.some((field) => (row[field.key] ?? "").toLowerCase().includes(term))
      ) {
        return false;
      }
      if (
        exhibitorFilter !== "all" &&
        (row.show_name ?? "").trim().toLowerCase() !== exhibitorFilter.trim().toLowerCase()
      ) {
        return false;
      }
      return activeUserFilter === "all" || row.created_by_initials === activeUserFilter;
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
  }, [exhibitors, term, exhibitorFilter, activeUserFilter, sort]);

  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const key of MONEY_FIELDS) {
      acc[key] = rows.reduce((sum, row) => sum + parseMoney(row[key]), 0);
    }
    return acc;
  }, [rows]);

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const header = ["User", ...EXHIBITOR_FIELDS.map((field) => field.label)];
    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((row) =>
        [row.created_by_initials ?? "", ...EXHIBITOR_FIELDS.map((f) => row[f.key] ?? "")]
          .map(csvCell)
          .join(","),
      ),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exhibitors-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
  };

  const hasFilters =
    activeUserFilter !== "all" ||
    exhibitorFilter !== "all" ||
    term.length > 0;

  const clearFilters = () => {
    setSearch("");
    setUserFilter("all");
    setExhibitorFilter("all");
    if (showParam) {
      navigate({ to: "/", search: {}, replace: true });
    }
  };

  const pageRows = rows;


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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitors"] });
      toast.success("Row deleted");
      setPendingDelete(null);
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
    if (!trimmed.show_name) {
      toast.error("Show is required.");
      return;
    }
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
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label htmlFor="filter-exhibitor" className="sr-only">
              Filter by show
            </label>
            <div className="relative">
              <select
                id="filter-exhibitor"
                value={exhibitorFilter}
                onChange={(event) => setExhibitorFilter(event.target.value)}
                className="block max-w-56 appearance-none truncate rounded-full bg-card py-1.5 pr-9 pl-4 text-sm text-foreground outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
              >
                <option value="all">All shows</option>
                {exhibitorOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            {isAdmin ? (
              <>
                <label htmlFor="filter-user" className="sr-only">
                  Filter by user
                </label>
                <div className="relative">
                  <select
                    id="filter-user"
                    value={userFilter}
                    onChange={(event) => setUserFilter(event.target.value)}
                    className="block appearance-none rounded-full bg-card py-1.5 pr-9 pl-4 text-sm text-foreground outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
                  >
                    <option value="all">All users</option>
                    {userOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </>
            ) : null}
            {hasFilters ? (
              <TwButton variant="secondary" onClick={clearFilters} aria-label="Clear filters">
                <X className="h-4 w-4" />
                Clear
              </TwButton>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <TwButton
                  variant="secondary"
                  onClick={hardRefresh}
                  disabled={refreshing}
                  aria-label="Refresh data"
                  className="h-9 w-9 justify-center rounded-full p-0"
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </TwButton>
              </TooltipTrigger>
              <TooltipContent>{refreshing ? "Refreshing…" : "Refresh"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TwButton
                  variant="secondary"
                  onClick={exportCsv}
                  aria-label="Export CSV"
                  className="h-9 w-9 justify-center rounded-full p-0"
                >
                  <Download className="h-4 w-4" />
                </TwButton>
              </TooltipTrigger>
              <TooltipContent>Export CSV</TooltipContent>
            </Tooltip>


          </div>

        </div>

        <div className="mt-8 flow-root">
          <div className="block min-w-full align-middle">
            <div className="rounded-t-lg rounded-b-none bg-card shadow-sm ring-1 ring-border">
              <div className="max-h-[70vh] overflow-x-auto overflow-y-auto rounded-t-lg md:overflow-x-hidden">
                <table className="w-full min-w-[1100px] table-auto divide-y divide-border md:min-w-0">
                  <thead>
                    <tr className="divide-x divide-border">
                      {isAdmin ? (
                        <th
                          scope="col"
                          className="sticky top-0 z-10 w-[64px] min-w-[64px] bg-muted px-3 py-3.5 text-center text-xs font-semibold whitespace-nowrap text-foreground"
                        >
                          <span className="sr-only">User</span>
                        </th>
                      ) : null}
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
                        className="sticky top-0 z-10 w-14 min-w-14 bg-muted px-1 py-3.5 text-right text-sm font-semibold whitespace-nowrap text-foreground"
                      >
                        <span className="sr-only">Actions</span>
                      </th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {refreshing ? <SkeletonRows rows={Math.max(pageRows.length, 5)} columns={EXHIBITOR_FIELDS.length + (isAdmin ? 2 : 1)} /> : null}
                    {!refreshing && pageRows.map((row, rowIndex) => {
                      const editing = editingId === row.id;
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "divide-x divide-border",
                            rowIndex % 2 === 1 && "bg-muted/40",
                            !editing && "hover:bg-muted/60",
                          )}
                        >
                          {isAdmin ? (
                            <td className="w-[64px] min-w-[64px] px-3 py-2 text-center text-sm whitespace-nowrap">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={cn(
                                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold",
                                      avatarTone(row.created_by_initials || "?"),
                                    )}
                                    aria-label={`Created by ${row.created_by_initials || "—"}`}
                                  >
                                    {row.created_by_initials || "—"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Created by {row.created_by_initials || "unknown"}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          ) : null}
                          {EXHIBITOR_FIELDS.map((field, index) => (

                            <td
                              key={field.key}
                              className={cn(
                                "px-3 py-2 text-sm break-normal [overflow-wrap:normal] hyphens-none text-muted-foreground",
                                index === 0 && "font-medium text-foreground",
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
                          <td className="w-14 min-w-14 px-1 py-2 text-center text-sm whitespace-nowrap">
                            {editing ? (
                              <div className="flex justify-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      disabled={saveMutation.isPending}
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
                                      aria-label="Save changes"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Save</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
                                      aria-label="Cancel editing"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Cancel</TooltipContent>
                                </Tooltip>
                              </div>


                            ) : (
                              <div className="flex justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
                                      aria-label={`Actions for ${row.exhibitor_name}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onSelect={() => startEdit(row)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                      disabled={deleteMutation.isPending}
                                      onSelect={() => setPendingDelete(row)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!refreshing && pageRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={EXHIBITOR_FIELDS.length + (isAdmin ? 2 : 1)}
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
                              <button type="button" onClick={openCreate} className={cn(twButtonClass("primary"), "mt-5")}>
                                <Plus className="-ml-0.5 h-4 w-4" />
                                Add exhibitor
                              </button>
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
                                onClick={clearFilters}
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
                  {rows.length > 0 ? (
                    <tfoot className="border-t-2 border-border bg-muted/60 font-semibold">
                      <tr className="divide-x divide-border">
                        <td className="px-3 py-2.5 text-xs uppercase text-muted-foreground" colSpan={isAdmin ? 2 : 1}>
                          Total
                        </td>
                        {EXHIBITOR_FIELDS.slice(1).map((field) => (
                          <td key={field.key} className="whitespace-nowrap px-3 py-2.5 text-sm">
                            {(MONEY_FIELDS as readonly string[]).includes(field.key) ? (
                              <Num>{formatMoney(totals[field.key] ?? 0)}</Num>
                            ) : null}
                          </td>
                        ))}
                        <td className="px-3 py-2.5" />
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>



            </div>
          </div>
        </div>
      </div>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exhibitor?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.exhibitor_name} will be permanently removed. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
    </TooltipProvider>

  );
}
