import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, MessageSquare, Plus } from "lucide-react";

const NAV = [
  { label: "Tracker", to: "/" },
  { label: "Exhibitors", to: "/" },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const openForm = async () => {
    if (pathname !== "/") await navigate({ to: "/" });
    setTimeout(() => window.dispatchEvent(new CustomEvent("open-exhibitor-form")), 0);
  };

  return (

    <header data-site-header className="sticky top-0 z-30 border-b border-border bg-card print:hidden">
      <div className="flex h-16 w-full items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          Shiplist
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>
          <button
            type="button"
            aria-label="Messages"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            <Bell className="h-5 w-5" />
          </button>
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-1 ring-border">
            RS
            <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
          </span>
        </div>
      </div>
    </header>
  );
}
