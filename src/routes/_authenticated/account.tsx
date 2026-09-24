import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account | FreightTRAK" },
      {
        name: "description",
        content: "View your FreightTRAK profile details, username, initials and account role.",
      },
      { property: "og:title", content: "My account | FreightTRAK" },
      {
        property: "og:description",
        content: "View your FreightTRAK profile details, username, initials and account role.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://logitrak-oac.lovable.app/og-image.png" },
      { name: "twitter:image", content: "https://logitrak-oac.lovable.app/og-image.png" },
    ],
  }),
  component: AccountPage,
});

const meQuery = queryOptions({ queryKey: ["me"], queryFn: () => getMe() });

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function AccountPage() {
  const { data: me, isLoading } = useQuery(meQuery);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">My account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your profile details and access level.
      </p>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : !me?.profile ? (
        <p className="mt-8 text-sm text-muted-foreground">No profile found for this account.</p>
      ) : (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground ring-1 ring-border">
              {me.profile.initials}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">
                {me.profile.first_name} {me.profile.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{me.profile.username}</p>
            </div>
          </div>

          <div className="mt-6">
            <Row label="First name" value={me.profile.first_name} />
            <Row label="Last name" value={me.profile.last_name} />
            <Row label="Username" value={me.profile.username} />
            <Row label="Initials" value={me.profile.initials} />
            <Row
              label="Role"
              value={
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground ring-1 ring-border">
                  {me.isAdmin ? "Admin" : "User"}
                </span>
              }
            />
          </div>
        </section>
      )}
    </main>
  );
}
