"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { UserDTO } from "@/lib/session";

export default function LoginPage() {
  const [users, setUsers] = useState<UserDTO[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ users: UserDTO[] }>("/api/session/users")
      .then((data) => setUsers(data.users))
      .catch(() => setUsers([]));
  }, []);

  async function signIn(email: string) {
    setPending(email);
    try {
      await apiFetch("/api/session", { method: "POST", body: { email } });
      // Full load, not router.push: the header's <Link href="/"> prefetched "/" while signed out,
      // and the client router would replay that cached redirect back to /login.
      window.location.href = "/";
    } catch {
      setPending(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6 pt-16">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          This demo uses test accounts. Pick one — no password needed.
        </p>
      </div>
      {users === null && <p className="text-muted-foreground text-sm">Loading accounts…</p>}
      {users?.length === 0 && (
        <p className="text-destructive text-sm">No test accounts found. Run the database seed and reload.</p>
      )}
      <div className="flex flex-col gap-3">
        {users?.map((user) => (
          <Button
            key={user.id}
            variant="outline"
            size="lg"
            className="justify-start"
            disabled={pending !== null}
            onClick={() => signIn(user.email)}
          >
            {pending === user.email ? "Signing in…" : `Sign in as ${user.name} — ${user.email}`}
          </Button>
        ))}
      </div>
    </main>
  );
}
