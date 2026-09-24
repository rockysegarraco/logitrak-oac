import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExhibitorForm } from "@/components/ExhibitorForm";
import { EMPTY_EXHIBITOR, makeDefaultExhibitor } from "@/lib/exhibitor-fields";
import { createExhibitor } from "@/lib/exhibitors.functions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ExhibitorCreateSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const create = useServerFn(createExhibitor);

  const mutation = useMutation({
    mutationFn: (values: typeof EMPTY_EXHIBITOR) => create({ data: values }),
    onSuccess: async () => {
      window.sessionStorage.removeItem(DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: ["exhibitors"] });
      toast.success("Exhibitor added");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="create-exhibitor-panel"
        side="right"
        onInteractOutside={(e) => e.preventDefault()}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl [&>button]:right-4 [&>button]:top-8 [&>button]:-translate-y-1/2 [&>button>svg]:h-6 [&>button>svg]:w-6"
      >
        <SheetHeader className="flex h-16 shrink-0 flex-row items-center border-b border-border bg-card px-4 py-0 sm:px-6">
          <SheetTitle className="text-base font-semibold">Add exhibitor</SheetTitle>
          <SheetDescription className="sr-only">
            Add a new exhibitor record.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <ExhibitorForm
            draftKey={DRAFT_KEY}
            initialValues={makeDefaultExhibitor()}
            submitLabel="Add Exhibitor"
            pending={mutation.isPending}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
