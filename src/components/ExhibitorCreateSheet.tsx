import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExhibitorForm } from "@/components/ExhibitorForm";
import { EMPTY_EXHIBITOR } from "@/lib/exhibitor-fields";
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
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-4 py-4 sm:px-6">
          <SheetTitle className="text-base font-semibold">Add exhibitor</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Type entries exactly as you would in the spreadsheet, e.g. "YES (SENT 1/28)".
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <ExhibitorForm
            initialValues={EMPTY_EXHIBITOR}
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
