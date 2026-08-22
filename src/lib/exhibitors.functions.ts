import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const exhibitorInput = z.object({
  exhibitor_name: z.string().trim().min(1, "Exhibitor name is required").max(200),
  booth_number: z.string().trim().max(50).default(""),
  paf_in_files: z.string().trim().max(200).default(""),
  request_for_paf_sent: z.string().trim().max(200).default(""),
  on_time_quote_sent: z.string().trim().max(200).default(""),
  on_time_charges_processed: z.string().trim().max(200).default(""),
  late_fee_quote_sent: z.string().trim().max(200).default(""),
  receiver_numbers_on_time: z.string().trim().max(500).default(""),
  receiver_numbers_late: z.string().trim().max(500).default(""),
});

export type ExhibitorInput = z.infer<typeof exhibitorInput>;

export type Exhibitor = ExhibitorInput & {
  id: string;
  created_by_initials: string;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, exhibitor_name, booth_number, paf_in_files, request_for_paf_sent, on_time_quote_sent, on_time_charges_processed, late_fee_quote_sent, receiver_numbers_on_time, receiver_numbers_late, created_by_initials, created_at, updated_at";

export const listExhibitors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exhibitors")
      .select(COLUMNS)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibitor[];
  });

export const getExhibitor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("exhibitors")
      .select(COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as Exhibitor | null;
  });

export const createExhibitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => exhibitorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("initials")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: row, error } = await context.supabase
      .from("exhibitors")
      .insert({
        ...data,
        created_by: context.userId,
        created_by_initials: profile?.initials ?? "??",
      })
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as Exhibitor;
  });

export const updateExhibitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    exhibitorInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const { data: row, error } = await context.supabase
      .from("exhibitors")
      .update(fields)
      .eq("id", id)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as Exhibitor;
  });

export const deleteExhibitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("exhibitors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
