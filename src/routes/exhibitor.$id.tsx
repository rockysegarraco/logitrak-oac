import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ExhibitorForm } from "@/components/ExhibitorForm";
import { EMPTY_EXHIBITOR } from "@/lib/exhibitor-fields";
import {
  deleteExhibitor,
  getExhibitor,
  updateExhibitor,
  type ExhibitorInput,
} from "@/lib/exhibitors.functions";

const exhibitorQuery = (id: string) =>
  queryOptions({
    queryKey: ["exhibitors", id],
    queryFn: () => getExhibitor({ data: { id } }),
  });

export const Route = createFileRoute("/exhibitor/$id")({
  head: () => ({
    meta: [
      { title: "Edit Exhibitor — Shipping Tracker" },
      {
        name: "description",
        content: "Update booth, PAF, quote, charge, and receiver details for this exhibitor.",
      },
      { property: "og:title", content: "Edit Exhibitor — Shipping Tracker" },
      {
        property: "og:description",
        content: "Update tracking details for an exhibitor in the shared shipping tracker.",
      },
    ],
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(exhibitorQuery(params.id));
  },
  component: EditExhibitorPage,
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

function EditExhibitorPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: exhibitor } = useSuspenseQuery(exhibitorQuery(id));
  const update = useServerFn(updateExhibitor);
  const remove = useServerFn(deleteExhibitor);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["exhibitors"] }),
      queryClient.invalidateQueries({ queryKey: ["exhibitors", id] }),
    ]);

  const saveMutation = useMutation({
    mutationFn: (values: ExhibitorInput) => update({ data: { ...values, id } }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Changes saved");
      router.navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id } }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Exhibitor deleted");
      router.navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

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

  const initialValues: ExhibitorInput = {
    ...EMPTY_EXHIBITOR,
    exhibitor_name: exhibitor.exhibitor_name,
    booth_number: exhibitor.booth_number,
    paf_in_files: exhibitor.paf_in_files,
    request_for_paf_sent: exhibitor.request_for_paf_sent,
    on_time_quote_sent: exhibitor.on_time_quote_sent,
    on_time_charges_processed: exhibitor.on_time_charges_processed,
    late_fee_quote_sent: exhibitor.late_fee_quote_sent,
    receiver_numbers_on_time: exhibitor.receiver_numbers_on_time,
    receiver_numbers_late: exhibitor.receiver_numbers_late,
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to tracker
        </Link>
        <h1 className="mt-4 text-base font-semibold text-foreground">{exhibitor.exhibitor_name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit this exhibitor's tracking details.</p>
        <div className="mt-6 rounded-lg bg-card px-4 py-6 shadow-sm ring-1 ring-border sm:p-8">
          <ExhibitorForm
            initialValues={initialValues}
            submitLabel="Save Changes"
            pending={saveMutation.isPending}
            deletePending={deleteMutation.isPending}
            onSubmit={(values) => saveMutation.mutate(values)}
            onCancel={() => router.navigate({ to: "/" })}
            onDelete={() => deleteMutation.mutate()}
          />
        </div>
      </div>
    </main>
  );
}
