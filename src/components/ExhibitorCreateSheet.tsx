import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExhibitorForm } from "@/components/ExhibitorForm";
import { EMPTY_EXHIBITOR } from "@/lib/exhibitor-fields";
import { createExhibitor, type Attachment } from "@/lib/exhibitors.functions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const DRAFT_KEY = "freighttrak:create-draft";

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
    mutationFn: (payload: { values: typeof EMPTY_EXHIBITOR; attachments: Attachment[] }) =>
      create({ data: { ...payload.values, attachments: payload.attachments } }),
    onSuccess: async () => {
      window.sessionStorage.removeItem(DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: ["exhibitors"] });
      toast.success("Exhibitor added");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const allowCloseRef = useRef(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Only close via Cancel, the X button, or a successful save —
        // never from outside clicks/focus changes (Safari fires these).
        if (next || allowCloseRef.current) {
          allowCloseRef.current = false;
          onOpenChange(next);
        }
      }}
    >
      <SheetContent
        id="create-exhibitor-panel"
        side="right"
        onPointerDownCapture={(e) => {
          const target = e.target as HTMLElement;
          const btn = target.closest("button");
          if (btn && btn.parentElement === e.currentTarget) allowCloseRef.current = true;
        }}
        onKeyDownCapture={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          const btn = (e.target as HTMLElement).closest("button");
          if (btn && btn.parentElement === e.currentTarget) allowCloseRef.current = true;
        }}
        onEscapeKeyDown={() => {
          allowCloseRef.current = true;
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
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
            initialValues={EMPTY_EXHIBITOR}
            submitLabel="Add Exhibitor"
            pending={mutation.isPending}
            onSubmit={(values, attachments) => mutation.mutate({ values, attachments })}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
