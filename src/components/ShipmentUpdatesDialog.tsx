import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, ListChecks, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TwButton } from "@/components/ui/tw";
import {
  addShipmentUpdate,
  deleteShipmentUpdate,
  listShipmentUpdates,
} from "@/lib/shipment-updates.functions";

type Props = {
  shipment: { id: string; exhibitor_name: string; show_name: string } | null;
  onOpenChange: (open: boolean) => void;
};

export function ShipmentUpdatesDialog({ shipment, onOpenChange }: Props) {
  const qc = useQueryClient();
  const list = useServerFn(listShipmentUpdates);
  const add = useServerFn(addShipmentUpdate);
  const remove = useServerFn(deleteShipmentUpdate);
  const [text, setText] = useState("");
  const key = ["shipment-updates", shipment?.id];

  const { data: updates = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => list({ data: { exhibitorId: shipment!.id } }),
    enabled: Boolean(shipment),
  });

  const addMutation = useMutation({
    mutationFn: () => add({ data: { exhibitorId: shipment!.id, text } }),
    onSuccess: () => {
      setText("");
      toast.success("Update saved");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't delete"),
  });

  return (
    <Dialog open={Boolean(shipment)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogTitle className="uppercase">Updates · {shipment?.exhibitor_name || shipment?.show_name}</DialogTitle>
        <DialogDescription>
          Type or paste an update in your own words. AI pulls out the current status, key events and follow-ups.
        </DialogDescription>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim().length >= 3) addMutation.mutate();
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={8000}
            placeholder="e.g. Spoke with carrier Tue — freight picked up 3/4, ETA dock Thursday AM. Missing BOL, need Maria to send by Wed."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-2 focus:outline-primary"
            disabled={addMutation.isPending}
          />
          <div className="flex justify-end">
            <TwButton type="submit" variant="primary" disabled={addMutation.isPending || text.trim().length < 3}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {addMutation.isPending ? "Reading update…" : "Analyze & save"}
            </TwButton>
          </div>
        </form>

        <div className="mt-2 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            updates.map((u) => (
              <article key={u.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current status</p>
                    <p className="text-sm font-semibold text-foreground">{u.current_status || "—"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(u.id)}
                    aria-label="Delete update"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {u.key_events.length > 0 ? (
                  <div className="mt-3">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <CalendarClock className="h-3 w-3" /> Key events
                    </p>
                    <ul className="mt-1 space-y-1 text-sm text-foreground">
                      {u.key_events.map((ev, i) => (
                        <li key={i}>
                          {ev.date ? <span className="font-semibold">{ev.date}: </span> : null}
                          {ev.event}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {u.follow_ups.length > 0 ? (
                  <div className="mt-3">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <ListChecks className="h-3 w-3" /> Follow-ups
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                      {u.follow_ups.map((f, i) => (
                        <li key={i}>
                          {f.action}
                          {f.owner || f.due ? (
                            <span className="text-muted-foreground">
                              {" "}({[f.owner, f.due && `due ${f.due}`].filter(Boolean).join(", ")})
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">
                    Original note · {u.created_by_initials} · {new Date(u.created_at).toLocaleString()}
                  </summary>
                  <p className="mt-1 whitespace-pre-wrap">{u.raw_text}</p>
                </details>
              </article>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
