import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { supabase } from "@/integrations/supabase/client";

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message.startsWith("Unauthorized");
}

let handlingAuthError = false;
async function handleAuthError(error: unknown) {
  if (!isUnauthorized(error) || handlingAuthError || typeof window === "undefined") return;
  handlingAuthError = true;
  try {
    await supabase.auth.signOut({ scope: "local" });
  } finally {
    window.location.replace("/auth");
  }
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleAuthError }),
    mutationCache: new MutationCache({ onError: handleAuthError }),
    defaultOptions: {
      queries: {
        retry: (count, error) => !isUnauthorized(error) && count < 2,
        throwOnError: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
