import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ExhibitorForm } from "@/components/ExhibitorForm";
import { EMPTY_EXHIBITOR } from "@/lib/exhibitor-fields";
import { createExhibitor } from "@/lib/exhibitors.functions";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "Add Exhibitor — Shipping Tracker" },
      {
        name: "description",
        content:
          "Add a new exhibitor with booth number, PAF status, quote status, and receiver numbers.",
      },
      { property: "og:title", content: "Add Exhibitor — Shipping Tracker" },
      {
        property: "og:description",
        content: "Add a new exhibitor row to the shared shipping tracker.",
      },
    ],
  }),
  component: NewExhibitorPage,
});

function NewExhibitorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const create = useServerFn(createExhibitor);

  const mutation = useMutation({
    mutationFn: (values: typeof EMPTY_EXHIBITOR) => create({ data: values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exhibitors"] });
      toast.success("Exhibitor added");
      router.navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to tracker
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Add Exhibitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Type entries exactly as you would in the spreadsheet, e.g. "YES (SENT 1/28)".
        </p>
        <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
          <ExhibitorForm
            initialValues={EMPTY_EXHIBITOR}
            submitLabel="Add Exhibitor"
            pending={mutation.isPending}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => router.navigate({ to: "/" })}
          />
        </div>
      </div>
    </main>
  );
}
