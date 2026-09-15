import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/supabase-auth-middleware";
import { z } from "zod";
import { initialsFrom, normalizeUsername, usernameToEmail } from "./username";

export type AppUser = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  initials: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  password: string | null;
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
  .middleware([requireAppAuth])
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
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, username, first_name, last_name, initials, is_active, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const roleFor = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    // Only admins can read this table (enforced by access rules); others get nothing.
    const { data: creds } = await context.supabase
      .from("user_credentials")
      .select("user_id, password");
    const passwordFor = new Map((creds ?? []).map((c) => [c.user_id, c.password]));
    return (profiles ?? []).map((p) => ({
      ...p,
      role: (roleFor.get(p.id) ?? "user") as "admin" | "user",
      password: passwordFor.get(p.id) ?? null,
    })) as AppUser[];
  });

export const createAppUser = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) => newUserInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can add users");

    const username = normalizeUsername(data.username);
    if (username.length < 3) throw new Error("Username is not valid");

    // Sign the account up with the public key so this works on any host,
    // without needing the private service-role key.
    const supabaseUrl = process.env["SUPABASE_URL"];
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!supabaseUrl || !publishableKey) throw new Error("Backend is not configured.");

    const { createClient } = await import("@supabase/supabase-js");
    const signupClient = createClient(supabaseUrl, publishableKey, {
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (headers.get("Authorization") === `Bearer ${publishableKey}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", publishableKey);
          return fetch(input, { ...init, headers });
        },
      },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data: created, error } = await signupClient.auth.signUp({
      email: usernameToEmail(username),
      password: data.password,
      options: {
        data: { username, first_name: data.first_name, last_name: data.last_name },
      },
    });
    if (error || !created.user) {
      throw new Error(
        error?.message?.toLowerCase().includes("already")
          ? "That username is already taken"
          : (error?.message ?? "Could not create the account"),
      );
    }

    const initials = initialsFrom(data.first_name, data.last_name, username);
    const { error: profileError } = await context.supabase.from("profiles").insert({
      id: created.user.id,
      username,
      first_name: data.first_name,
      last_name: data.last_name,
      initials,
    });
    if (profileError) {
      throw new Error(
        profileError.code === "23505" ? "That username is already taken" : profileError.message,
      );
    }
    await context.supabase
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });

    return { id: created.user.id, username, initials };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        password: z.string().min(8, "Password must be at least 8 characters").max(72),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can reset passwords");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("username")
      .eq("id", data.id)
      .maybeSingle();
    if (!profile) throw new Error("That account no longer exists.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);

    return { username: profile.username };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can change access");
    if (data.id === context.userId) throw new Error("You can't change your own access");

    const { data: row, error } = await context.supabase
      .from("profiles")
      .update({ is_active: data.is_active })
      .eq("id", data.id)
      .select("id, is_active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That account no longer exists.");
    return row;
  });
