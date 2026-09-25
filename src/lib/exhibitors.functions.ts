import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/supabase-auth-middleware";
import { z } from "zod";

const exhibitorInput = z.object({
  booth_number: z.string().trim().max(50).default(""),
  show_name: z.string().trim().min(1, "Show is required").max(200),
  exhibitor_name: z.string().trim().max(200).default(""),
  pro_number: z.string().trim().max(100).default(""),
  invoice_number: z.string().trim().max(100).default(""),
  city: z.string().trim().max(120).default(""),
  state: z.string().trim().max(50).default(""),
  estimated_weight: z.string().trim().max(50).default(""),
  shipping_date: z.string().trim().max(50).default(""),
  delivery_date: z.string().trim().max(50).default(""),
  actual_costs: z.string().trim().max(50).default(""),
  final_invoice: z.string().trim().max(50).default(""),
  actual_revenue: z.string().trim().max(50).default(""),
});

export type ExhibitorInput = z.infer<typeof exhibitorInput>;

const attachmentSchema = z.object({
  path: z.string().min(1).max(500),
  name: z.string().min(1).max(300),
  size: z.number().nonnegative().optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;
const attachmentsField = z.array(attachmentSchema).max(20);

export type Exhibitor = ExhibitorInput & {
  id: string;
  attachments: Attachment[];
  created_by_initials: string;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, booth_number, show_name, exhibitor_name, pro_number, invoice_number, city, state, estimated_weight, shipping_date, delivery_date, actual_costs, final_invoice, actual_revenue, attachments, created_by_initials, created_at, updated_at";

export const listExhibitors = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exhibitors")
      .select(COLUMNS)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibitor[];
  });

export const getExhibitor = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
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
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) =>
    exhibitorInput.extend({ attachments: attachmentsField.default([]) }).parse(input),
  )
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
        created_by_initials: profile?.initials ?? "??",
        created_by: context.userId,
      })
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("The shipment could not be created. Please refresh and try again.");
    return row as Exhibitor;
  });

export const updateExhibitor = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) =>
    exhibitorInput
      .extend({ id: z.string().uuid(), attachments: attachmentsField.optional() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const { data: row, error } = await context.supabase
      .from("exhibitors")
      .update(fields)
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That record no longer exists. Please refresh and try again.");
    return row as Exhibitor;
  });

export const deleteExhibitor = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("exhibitors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
