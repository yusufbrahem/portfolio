"use client";

import { useState, useTransition } from "react";
import { resetUserPassword } from "@/app/actions/super-admin";
import { Key, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ResetPasswordButton({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        await resetUserPassword(userId, newPassword);
        setSuccess("Password reset successfully!");
        setNewPassword("");
        setConfirmPassword("");
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(null);
          router.refresh();
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reset password");
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all flex items-center gap-1"
        title="Reset password"
      >
        <Key className="h-3 w-3" />
        <span className="hidden sm:inline">Reset</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-panel border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setNewPassword("");
              setConfirmPassword("");
            }}
            className="text-muted hover:text-foreground transition-colors"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted mb-4">
          Reset password for <strong>{userEmail}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-muted-disabled">
              Must be at least 8 characters long.
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
              disabled={isPending}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={isPending}
              className="px-4 py-2 border border-border bg-background text-foreground rounded-lg hover:bg-panel2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
