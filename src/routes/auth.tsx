import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import { usernameToEmail } from "@/lib/username";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in | Shiplist Admin" },
      {
        name: "description",
        content: "Sign in to the Shiplist exhibitor shipping tracker admin console.",
      },
      { property: "og:title", content: "Sign in | Shiplist Admin" },
      {
        property: "og:description",
        content: "Sign in to the Shiplist exhibitor shipping tracker admin console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setPending(false);
    if (signInError) {
      setError("Incorrect username or password.");
      return;
    }
    await navigate({ to: "/", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the username and password your admin gave you.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <TwLabel htmlFor="username">Username</TwLabel>
            <div className="mt-2">
              <TwInput
                id="username"
                value={username}
                autoComplete="username"
                autoCapitalize="none"
                maxLength={40}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
          </div>
          <div>
            <TwLabel htmlFor="password">Password</TwLabel>
            <div className="mt-2">
              <TwInput
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                maxLength={72}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <TwButton type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </TwButton>
        </form>
      </div>
    </main>
  );
}
