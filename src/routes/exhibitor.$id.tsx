import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { Num } from "@/components/Num";
import { TwButton } from "@/components/ui/tw";
import { EXHIBITOR_FIELDS } from "@/lib/exhibitor-fields";
import { getExhibitor } from "@/lib/exhibitors.functions";

const exhibitorQuery = (id: string) =>
  queryOptions({
    queryKey: ["exhibitors", id],
    queryFn: () => getExhibitor({ data: { id } }),
  });

export const Route = createFileRoute("/exhibitor/$id")({
  head: () => ({
    meta: [
      { title: "Exhibitor Shipping Summary — Tracker" },
      {
        name: "description",
        content:
          "Printable one-page summary of an exhibitor's booth, PAF, quote, charge, and receiver details.",
      },
      { property: "og:title", content: "Exhibitor Shipping Summary — Tracker" },
      {
        property: "og:description",
        content: "View and print a single exhibitor's shipping tracking record.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(exhibitorQuery(params.id));
  },
  component: ExhibitorSummaryPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-xl p-10 text-center" role="alert">
      <h1 className="text-lg font-semibold">Couldn't load this exhibitor</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Exhibitor not found.</div>
  ),
});

const SECTIONS: { title: string; keys: string[] }[] = [
  { title: "Exhibitor", keys: ["exhibitor_name", "booth_number"] },
  { title: "PAF", keys: ["paf_in_files", "request_for_paf_sent"] },
  {
    title: "Quotes & Charges",
    keys: ["on_time_quote_sent", "on_time_charges_processed", "late_fee_quote_sent"],
  },
  { title: "Receivers", keys: ["receiver_numbers_on_time", "receiver_numbers_late"] },
];

function ExhibitorSummaryPage() {
  const { id } = Route.useParams();
  const { data: exhibitor } = useSuspenseQuery(exhibitorQuery(id));

  if (!exhibitor) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">Exhibitor not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          Back to tracker
        </Link>
      </main>
    );
  }

  const value = (key: string) => (exhibitor as Record<string, string>)[key]?.trim() ?? "";

  return (
    <main className="min-h-screen bg-muted/40 print:bg-transparent">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tracker
          </Link>
          <TwButton onClick={() => window.print()} aria-label="Print this summary">
            <Printer className="h-4 w-4" />
            Print
          </TwButton>
        </div>

        <article className="mt-5 rounded-lg bg-card p-8 shadow-sm ring-1 ring-border print:mt-0 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Exhibitor Shipping Summary
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-foreground uppercase">
                <Num caseMode="upper">{exhibitor.exhibitor_name || "—"}</Num>
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Booth
              </p>
              <p className="text-2xl font-semibold text-foreground">
                <Num caseMode="upper">{exhibitor.booth_number || "—"}</Num>
              </p>
            </div>
          </header>

          <div className="mt-6 space-y-6">
            {SECTIONS.slice(1).map((section) => (
              <section key={section.title} className="break-inside-avoid">
                <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  {section.title}
                </h2>
                <dl className="mt-2 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  {section.keys.map((key) => {
                    const field = EXHIBITOR_FIELDS.find((f) => f.key === key)!;
                    const v = value(key);
                    return (
                      <div
                        key={key}
                        className="border-b border-border/70 pb-2 last:border-b sm:last:border-b"
                      >
                        <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {field.label}
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-foreground uppercase">
                          {v ? (
                            <Num caseMode="upper">{v}</Num>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>

          <footer className="mt-8 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
            <span>Exhibitor Shipping Tracker</span>
            <span>
              Printed <Num caseMode="upper">{new Date().toLocaleDateString()}</Num>
            </span>
          </footer>
        </article>
      </div>
    </main>
  );
}
