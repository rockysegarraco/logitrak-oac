import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/supabase-auth-middleware";
import { z } from "zod";

export type DirectoryEntry = {
  id: string;
  name: string;
  created_by_initials: string;
  created_at: string;
};

const COLUMNS = "id, name, created_by_initials, created_at";

export const listDirectory = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exhibitor_directory")
      .select(COLUMNS)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as DirectoryEntry[];
  });

export const createDirectoryEntry = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ name: z.string().trim().min(1, "Show name is required").max(200) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("initials")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: row, error } = await context.supabase
      .from("exhibitor_directory")
      .insert({
        name: data.name.toUpperCase(),
        created_by: context.userId,
        created_by_initials: profile?.initials ?? "??",
      })
      .select(COLUMNS)
      .single();
    if (error) {
      throw new Error(
        error.code === "23505" ? "That show is already on the list" : error.message,
      );
    }
    return row as DirectoryEntry;
  });

export const deleteDirectoryEntry = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("exhibitor_directory")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateDirectoryEntry = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1, "Show name is required").max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: current } = await context.supabase
      .from("exhibitor_directory")
      .select("name")
      .eq("id", data.id)
      .maybeSingle();

    const name = data.name.toUpperCase();
    const { data: row, error } = await context.supabase
      .from("exhibitor_directory")
      .update({ name })
      .eq("id", data.id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) {
      throw new Error(
        error.code === "23505" ? "That show is already on the list" : error.message,
      );
    }
    if (!row) {
      throw new Error("You can only rename shows you added.");
    }

    if (current?.name && current.name !== name) {
      // Shows are shared across users; RLS lets any signed-in user update
      // shipment rows, so the caller's own client can do the bulk rename.
      const { error: renameError } = await context.supabase
        .from("exhibitors")
        .update({ show_name: name })
        .eq("show_name", current.name);
      if (renameError) throw new Error(renameError.message);
    }

    return row as DirectoryEntry;
  });
