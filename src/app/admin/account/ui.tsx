"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyAccount } from "@/app/actions/account";
import { signOut } from "next-auth/react";

export function AccountForm({
  initialEmail,
  initialName,
}: {
  initialEmail: string;
  initialName: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await updateMyAccount({ email, name });
        if (res.emailChanged) {
          // Force re-login so session token reflects new email
          await signOut({ callbackUrl: "/admin/login" });
          return;
        }
        setSuccess("Saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update account");
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="name">
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
              Login email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              required
            />
            <p className="mt-1 text-xs text-muted-disabled">
              If you change your email, you’ll be logged out and must sign in again.
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : success ? (
          <p className="text-sm text-green-400">{success}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

