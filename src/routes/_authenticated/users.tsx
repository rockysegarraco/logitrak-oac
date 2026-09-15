import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { TwButton, TwInput, TwLabel } from "@/components/ui/tw";
import {
  createAppUser,
  getMe,
  listUsers,
  setUserActive,
  type AppUser,
} from "@/lib/users.functions";
import { generatePassword, normalizeUsername } from "@/lib/username";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users | FreightTRAK Admin" },
      {
        name: "description",
        content: "Create and manage FreightTRAK accounts with usernames and generated passwords.",
      },
      { property: "og:title", content: "Users | FreightTRAK Admin" },
      {
        property: "og:description",
        content: "Create and manage FreightTRAK accounts with usernames and generated passwords.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

const usersQuery = queryOptions({ queryKey: ["users"], queryFn: () => listUsers() });
const meQuery = queryOptions({ queryKey: ["me"], queryFn: () => getMe() });

function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users } = useQuery(usersQuery);
  const { data: me } = useQuery(meQuery);
  const create = useServerFn(createAppUser);
  const setActive = useServerFn(setUserActive);
  const [shown, setShown] = useState<Record<string, boolean>>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [password, setPassword] = useState(() => generatePassword());
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          first_name: firstName,
          last_name: lastName,
          username: normalizeUsername(username),
          password,
          role,
        },
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreated({ username: result.username, password });
      setFirstName("");
      setLastName("");
      setUsername("");
      setRole("user");
      setPassword(generatePassword());
      setError(null);
      toast.success("User created");
    },
    onError: (err: Error) => setError(err.message),
  });

  const accessMutation = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) => setActive({ data: vars }),
    onSuccess: async (_result, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(vars.is_active ? "Access restored" : "Access removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });


  if (me && !me.isAdmin) {
    return (
      <main className="px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-lg font-semibold text-foreground">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask an admin if you need access to user management.
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold tracking-tight text-foreground">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create accounts with a username and a generated password. Share the password with the
        user — it can't be shown again.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <form
          className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!firstName.trim() || !lastName.trim() || normalizeUsername(username).length < 3) {
              setError("First name, last name and a username (3+ characters) are required.");
              return;
            }
            createMutation.mutate();
          }}
        >
          <h2 className="text-base font-semibold text-foreground">Add user</h2>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <TwLabel htmlFor="first-name">First name</TwLabel>
              <div className="mt-2">
                <TwInput
                  id="first-name"
                  value={firstName}
                  maxLength={60}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </div>
            </div>
            <div>
              <TwLabel htmlFor="last-name">Last name</TwLabel>
              <div className="mt-2">
                <TwInput
                  id="last-name"
                  value={lastName}
                  maxLength={60}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <TwLabel htmlFor="new-username">Username</TwLabel>
            <div className="mt-2">
              <TwInput
                id="new-username"
                value={username}
                maxLength={40}
                autoCapitalize="none"
                placeholder="jsmith"
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <TwLabel htmlFor="new-password">Password</TwLabel>
            <div className="mt-2 flex items-center gap-2">
              <TwInput
                id="new-password"
                value={password}
                maxLength={72}
                onChange={(event) => setPassword(event.target.value)}
              />
              <TwButton
                variant="secondary"
                aria-label="Generate a new password"
                onClick={() => setPassword(generatePassword())}
              >
                <RefreshCw className="h-4 w-4" />
              </TwButton>
            </div>
          </div>

          <div className="mt-4">
            <TwLabel htmlFor="new-role">Role</TwLabel>
            <div className="relative mt-2">
              <select
                id="new-role"
                value={role}
                onChange={(event) => setRole(event.target.value as "admin" | "user")}
                className="block w-full appearance-none rounded-md bg-card py-1.5 pr-9 pl-3 text-sm text-foreground outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6">
            <TwButton type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create user"}
            </TwButton>
          </div>

          {created ? (
            <div className="mt-6 rounded-xl bg-muted p-4 text-sm">
              <p className="font-semibold text-foreground">Account created</p>
              <p className="mt-1 text-muted-foreground">
                Username: <span className="font-medium text-foreground">{created.username}</span>
              </p>
              <p className="text-muted-foreground">
                Password: <span className="num font-medium text-foreground">{created.password}</span>
              </p>
              <TwButton
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  navigator.clipboard
                    .writeText(`${created.username} / ${created.password}`)
                    .then(() => toast.success("Copied"))
                    .catch(() => toast.error("Couldn't copy"));
                }}
              >
                <Copy className="h-4 w-4" />
                Copy
              </TwButton>
            </div>
          ) : null}
        </form>

        <div>
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Access</th>
                <th className="w-40 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(users ?? []).map((user: AppUser) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-foreground">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.username}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {user.password ? (
                      <div className="flex items-center gap-2">
                        <span className="num text-foreground">
                          {shown[user.id] ? user.password : "••••••••"}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={
                            shown[user.id]
                              ? `Hide password for ${user.username}`
                              : `Show password for ${user.username}`
                          }
                          onClick={() =>
                            setShown((prev) => ({ ...prev, [user.id]: !prev[user.id] }))
                          }
                        >
                          {shown[user.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Copy password for ${user.username}`}
                          onClick={() => {
                            navigator.clipboard
                              .writeText(user.password ?? "")
                              .then(() => toast.success("Copied"))
                              .catch(() => toast.error("Couldn't copy"));
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <TwInput
                          className="h-8 w-36"
                          placeholder="Enter password"
                          aria-label={`Password for ${user.username}`}
                          value={draft[user.id] ?? ""}
                          onChange={(event) =>
                            setDraft((prev) => ({ ...prev, [user.id]: event.target.value }))
                          }
                        />
                        <TwButton
                          variant="secondary"
                          className="whitespace-nowrap"
                          disabled={saveMutation.isPending || !(draft[user.id] ?? "").trim()}
                          onClick={() =>
                            saveMutation.mutate({
                              id: user.id,
                              password: (draft[user.id] ?? "").trim(),
                            })
                          }
                        >
                          Save
                        </TwButton>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.is_active
                          ? "bg-muted text-foreground"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {user.is_active ? "Active" : "No access"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {me?.profile?.id === user.id ? null : (
                      <TwButton
                        variant="secondary"
                        className="whitespace-nowrap"
                        disabled={accessMutation.isPending}
                        aria-label={
                          user.is_active
                            ? `Remove access for ${user.username}`
                            : `Restore access for ${user.username}`
                        }
                        onClick={() =>
                          accessMutation.mutate({ id: user.id, is_active: !user.is_active })
                        }
                      >
                        {user.is_active ? "Remove access" : "Restore"}
                      </TwButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(users ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </main>
  );
}
