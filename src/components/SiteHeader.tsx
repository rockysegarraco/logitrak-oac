import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, LayoutGrid, LogOut, Plus, Shield, User, Users } from "lucide-react";
import oacMark from "@/assets/oac-mark.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [hasSession, setHasSession] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    retry: false,
    enabled: hasSession && pathname !== "/auth",
  });

  // Render only after hydration: the server has no session, so a server-rendered
  // header can survive as stale markup next to the hydrated one on slow loads.
  if (!mounted || pathname === "/auth") return null;

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
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:gap-8 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center" aria-label="FreightTRAK home">
          <img src={freightLogo} alt="FreightTRAK" className="h-7 w-auto shrink-0 sm:h-8" />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {onTracker && me ? (
            <button
              type="button"
              onClick={onCreateNew}
              aria-haspopup="dialog"
              aria-expanded={createOpen}
              aria-controls="create-exhibitor-panel"
              className="inline-flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border p-0 text-sm font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer sm:size-auto sm:px-5 sm:py-2.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create New</span>
              <span className="sr-only sm:hidden">Create New</span>
            </button>
          ) : null}
          {me?.profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border py-1 pr-3 pl-1 transition-colors hover:bg-muted"
                >
                  <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {me.isAdmin ? <Shield className="h-4 w-4" /> : me.profile.initials}
                    <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                  </span>
                  <ChevronDown
                    aria-hidden
                    className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-sm font-semibold text-foreground">
                    {me.profile.first_name} {me.profile.last_name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {me.profile.username}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Tracker
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/shows">
                    <Building2 className="mr-2 h-4 w-4" />
                    Shows
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/account">
                    <User className="mr-2 h-4 w-4" />
                    My account
                  </Link>
                </DropdownMenuItem>

                {me.isAdmin ? (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/users">
                      <Users className="mr-2 h-4 w-4" />
                      Users
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => void signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}

