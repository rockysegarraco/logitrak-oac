import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import authArt from "@/assets/auth-art.jpg";
import oacMark from "@/assets/oac-mark.svg";
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
    <main
      className="flex h-[100dvh] max-h-[100dvh] items-stretch overflow-hidden bg-muted [--auth-pad:0px] sm:[--auth-pad:1.5rem] lg:[--auth-pad:2.5rem]"
      style={{
        paddingTop: "max(env(safe-area-inset-top), var(--auth-pad, 0px))",
        paddingBottom: "max(env(safe-area-inset-bottom), var(--auth-pad, 0px))",
        paddingLeft: "max(env(safe-area-inset-left), var(--auth-pad, 0px))",
        paddingRight: "max(env(safe-area-inset-right), var(--auth-pad, 0px))",
      }}
    >
      <div className="flex w-full overflow-hidden rounded-none bg-card shadow-xl ring-1 ring-border sm:rounded-3xl">
        <div className="relative hidden w-1/2 bg-black lg:block">
          <img
            src={authArt}
            alt=""
            width={1024}
            height={1408}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex w-full min-h-0 flex-col justify-center overflow-y-auto overscroll-contain px-6 py-8 sm:px-14 lg:w-1/2">
          <div className="mx-auto w-full max-w-sm">
            <img src={oacMark} alt="Ortiz&Co" className="mx-auto size-14" />

            <h1 className="mt-6 text-center text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Welcome back.
            </h1>
            <p className="mt-1 text-center text-xl font-light sm:text-2xl tracking-tight text-muted-foreground">
              Sign in to the shiplist.
            </p>

            <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <TwLabel htmlFor="username" className="sr-only">
                  Username
                </TwLabel>
                <TwInput
                  id="username"
                  value={username}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoCapitalize="none"
                  maxLength={40}
                  className="rounded-xl bg-muted/60 px-4 py-3 outline-transparent"
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  maxLength={72}
                  className="rounded-xl bg-muted/60 px-4 py-3 pr-12 outline-transparent"
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

              <TwButton
                type="submit"
                className="w-full rounded-xl py-3 text-base"
                disabled={pending}
              >
                {pending ? "Signing in..." : "Sign in"}
              </TwButton>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Accounts are created by your admin.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
