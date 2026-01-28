"use client";

import { useState, useTransition, useEffect } from "react";
import { changeMyPassword } from "@/app/actions/account";
import { getMinPasswordLengthAction } from "@/app/actions/password-validation";
import { Lock, Loader2 } from "lucide-react";

export function ChangePasswordForm({ isImpersonating }: { isImpersonating: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [minPasswordLength, setMinPasswordLength] = useState(6); // Default fallback
  const [isPending, startTransition] = useTransition();

  // Fetch minimum password length from server
  useEffect(() => {
    getMinPasswordLengthAction().then(setMinPasswordLength).catch(() => {
      // Fallback to 6 if fetch fails
      setMinPasswordLength(6);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (newPassword.length < minPasswordLength) {
      setError(`New password must be at least ${minPasswordLength} characters long`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        await changeMyPassword({ currentPassword, newPassword });
        setSuccess("Password changed successfully.");
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to change password");
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5" />
        Change Password
      </h2>

      {isImpersonating && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Cannot change password while impersonating. Stop impersonation to make changes.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isPending || isImpersonating}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            required
            autoComplete="current-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending || isImpersonating}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            required
            minLength={minPasswordLength}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-muted-disabled">
            Must be at least {minPasswordLength} characters long.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending || isImpersonating}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            required
            minLength={minPasswordLength}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        <button
          type="submit"
          disabled={isPending || isImpersonating}
          className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Changing...
            </>
          ) : (
            "Change password"
          )}
        </button>
      </form>
    </div>
  );
}
