import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/supabase-auth-middleware";
import { z } from "zod";

export type ShipmentUpdate = {
  id: string;
  exhibitor_id: string;
  created_by: string;
  created_by_initials: string;
  raw_text: string;
  current_status: string;
  key_events: { date: string | null; event: string }[];
  follow_ups: { action: string; owner: string | null; due: string | null }[];
  created_at: string;
};

const COLS = "id, exhibitor_id, created_by, created_by_initials, raw_text, current_status, key_events, follow_ups, created_at";

export const listShipmentUpdates = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .inputValidator((i: { exhibitorId: string }) => z.object({ exhibitorId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("shipment_updates")
      .select(COLS)
      .eq("exhibitor_id", data.exhibitorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ShipmentUpdate[];
  });

export const addShipmentUpdate = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((i: { exhibitorId: string; text: string }) =>
    z.object({ exhibitorId: z.string().uuid(), text: z.string().trim().min(3).max(8000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: ship, error: shipErr } = await context.supabase
      .from("exhibitors")
      .select("exhibitor_name, booth_number, show_name, city, state")
      .eq("id", data.exhibitorId)
      .maybeSingle();
    if (shipErr) throw new Error(shipErr.message);
    if (!ship) throw new Error("That shipment no longer exists.");

    const { extractShipmentUpdate } = await import("@/lib/shipment-ai.server");
    const ctx = `${ship.exhibitor_name || "Unnamed"}, booth ${ship.booth_number || "?"}, ${ship.show_name}, ${ship.city} ${ship.state}`;
    const extracted = await extractShipmentUpdate(data.text, ctx);

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("initials")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: row, error } = await context.supabase
      .from("shipment_updates")
      .insert({
        exhibitor_id: data.exhibitorId,
        created_by: context.userId,
        created_by_initials: profile?.initials ?? "??",
        raw_text: data.text,
        current_status: extracted.current_status,
        key_events: extracted.key_events,
        follow_ups: extracted.follow_ups,
      })
      .select(COLS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("The update could not be saved.");
    return row as unknown as ShipmentUpdate;
  });

export const deleteShipmentUpdate = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("shipment_updates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
