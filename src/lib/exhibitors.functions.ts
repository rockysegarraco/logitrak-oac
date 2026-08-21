import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

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
  created_at: string;
  updated_at: string;
};

function getClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const COLUMNS =
  "id, exhibitor_name, booth_number, paf_in_files, request_for_paf_sent, on_time_quote_sent, on_time_charges_processed, late_fee_quote_sent, receiver_numbers_on_time, receiver_numbers_late, created_at, updated_at";

export const listExhibitors = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await getClient()
    .from("exhibitors")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Exhibitor[];
});

export const getExhibitor = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await getClient()
      .from("exhibitors")
      .select(COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as Exhibitor | null;
  });

export const createExhibitor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => exhibitorInput.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await getClient()
      .from("exhibitors")
      .insert(data)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as Exhibitor;
  });

export const updateExhibitor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    exhibitorInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
    const { data: row, error } = await getClient()
      .from("exhibitors")
      .update(fields)
      .eq("id", id)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as Exhibitor;
  });

export const deleteExhibitor = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await getClient().from("exhibitors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
