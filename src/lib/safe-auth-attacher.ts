import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const attachSafeSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return next({
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("jwt issued at future")) {
        await supabase.auth.signOut({ scope: "local" });
      }
      return next({ headers: {} });
    }
  },
);