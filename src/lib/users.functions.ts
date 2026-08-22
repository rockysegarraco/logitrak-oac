import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { initialsFrom, normalizeUsername, usernameToEmail } from "./username";

export type AppUser = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  initials: string;
  role: "admin" | "user";
  created_at: string;
};

const newUserInput = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(60),
  last_name: z.string().trim().min(1, "Last name is required").max(60),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(["admin", "user"]).default("user"),
});

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, username, first_name, last_name, initials")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { profile: profile ?? null, isAdmin: Boolean(isAdmin) };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, username, first_name, last_name, initials, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const roleFor = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    return (profiles ?? []).map((p) => ({
      ...p,
      role: (roleFor.get(p.id) ?? "user") as "admin" | "user",
    })) as AppUser[];
  });

export const createAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => newUserInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can add users");

    const username = normalizeUsername(data.username);
    if (username.length < 3) throw new Error("Username is not valid");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(username),
      password: data.password,
      email_confirm: true,
      user_metadata: { username, first_name: data.first_name, last_name: data.last_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create the account");

    const initials = initialsFrom(data.first_name, data.last_name, username);
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      username,
      first_name: data.first_name,
      last_name: data.last_name,
      initials,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(
        profileError.code === "23505" ? "That username is already taken" : profileError.message,
      );
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });

    return { id: created.user.id, username, initials };
  });

export const deleteAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can remove users");
    if (data.id === context.userId) throw new Error("You can't remove your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
