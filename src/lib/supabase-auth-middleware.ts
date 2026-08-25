import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const requireAppAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabasePublishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Backend is not configured.");
  }

  const request = getRequest();
  const authHeader = request?.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Please sign in again.");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (token.split(".").length !== 3) {
    throw new Error("Unauthorized: Please sign in again.");
  }

  const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
    global: {
      fetch: createSupabaseFetch(supabasePublishableKey),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Unauthorized: Please sign in again.");
  }

  return next({
    context: {
      supabase,
      userId: data.user.id,
      claims: data.user.app_metadata,
    },
  });
});