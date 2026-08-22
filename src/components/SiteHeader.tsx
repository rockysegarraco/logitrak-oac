import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/users.functions";

export function SiteHeader({
  createOpen,
  onCreateNew,
}: {
  createOpen: boolean;
  onCreateNew: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    retry: false,
  });

  if (pathname === "/auth") return null;

  const onTracker = pathname === "/";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <header
      data-site-header
      className="sticky top-0 z-30 border-b border-border bg-card print:hidden"
    >
      <div className="flex h-16 w-full items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          Shiplist
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            to="/"
            className="text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
          >
            Tracker
          </Link>
          {me?.isAdmin ? (
            <Link
              to="/users"
              className="text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
            >
              Users
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {onTracker ? (
            <button
              type="button"
              onClick={onCreateNew}
              aria-haspopup="dialog"
              aria-expanded={createOpen}
              aria-controls="create-exhibitor-panel"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Create New
            </button>
          ) : null}
          {me?.profile ? (
            <>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <span
                title={`${me.profile.first_name} ${me.profile.last_name}`}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-1 ring-border"
              >
                {me.profile.initials}
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </span>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
