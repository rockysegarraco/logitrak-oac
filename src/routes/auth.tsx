import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import authArt from "@/assets/auth-believe.jpg.asset.json";
import oacMark from "@/assets/oac-mark.svg";
import { supabase } from "@/integrations/supabase/client";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import { usernameToEmail } from "@/lib/username";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in | FreightTRAK Admin" },
      {
        name: "description",
        content: "Sign in to the FreightTRAK exhibitor shipping tracker admin console.",
      },
      { property: "og:title", content: "Sign in | FreightTRAK Admin" },
      {
        property: "og:description",
        content: "Sign in to the FreightTRAK exhibitor shipping tracker admin console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) throw redirect({ to: "/" });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("jwt issued at future")) {
        await supabase.auth.signOut({ scope: "local" });
      }
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // Lock page scrolling while the sign-in screen is mounted.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

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
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-5 sm:px-10">
        <img src={oacMark} alt="Ortiz&Co" className="size-9" />
        <span className="text-2xl font-semibold tracking-tight text-foreground">FreightTRAK</span>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-10 sm:justify-end sm:px-10 lg:pr-24">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <h1 className="text-center text-3xl font-bold tracking-tight text-foreground">
            Log in to FreightTRAK
          </h1>

          <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <TwLabel htmlFor="username" className="sr-only">
                Username
              </TwLabel>
              <TwInput
                id="username"
                value={username}
                placeholder="Username"
                autoComplete="username"
                autoCapitalize="none"
                maxLength={40}
                className="rounded-xl px-4 py-3"
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="relative">
              <TwLabel htmlFor="password" className="sr-only">
                Password
              </TwLabel>
              <TwInput
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="Password"
                autoComplete="current-password"
                maxLength={72}
                className="rounded-xl px-4 py-3 pr-12"
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <Eye className="size-5" aria-hidden="true" />
                ) : (
                  <EyeOff className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-x-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(event) => setKeepSignedIn(event.target.checked)}
                className="size-4 cursor-pointer rounded border-border accent-primary"
              />
              Keep me signed in
            </label>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <TwButton type="submit" className="w-full py-3 text-base font-semibold" disabled={pending}>
              {pending ? "Signing in..." : "Continue"}
            </TwButton>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Accounts are created by your admin.
          </p>
        </div>
      </main>
    </div>
  );
}

