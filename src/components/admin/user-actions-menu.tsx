"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { MoreVertical, Eye, EyeOff, ExternalLink, Key, Trash2 } from "lucide-react";
import Link from "next/link";
import { resetUserPassword } from "@/app/actions/super-admin";
import { deleteUser } from "@/app/actions/super-admin";
import { getMinPasswordLengthAction } from "@/app/actions/password-validation";
import { useRouter } from "next/navigation";

function ImpersonateForm({
  portfolioId,
  isCurrentlyImpersonating,
  onImpersonate,
  onClose,
}: {
  portfolioId: string;
  isCurrentlyImpersonating: boolean;
  onImpersonate: (portfolioId: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    onClose();
    startTransition(async () => {
      const targetPortfolioId = isCurrentlyImpersonating ? null : portfolioId;
      await onImpersonate(targetPortfolioId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-panel2 transition-colors text-left disabled:opacity-50"
    >
      {isCurrentlyImpersonating ? (
        <>
          <EyeOff className="h-3 w-3" />
          Stop Impersonating
        </>
      ) : (
        <>
          <Eye className="h-3 w-3" />
          Impersonate User
        </>
      )}
    </button>
  );
}

type UserActionsMenuProps = {
  user: {
    id: string;
    email: string;
    portfolio: {
      id: string;
      slug: string | null;
    } | null;
  };
  isCurrentlyImpersonating: boolean;
  currentUserId: string;
  onImpersonate: (portfolioId: string | null) => Promise<void>;
};

export function UserActionsMenu({
  user,
  isCurrentlyImpersonating,
  currentUserId,
  onImpersonate,
}: UserActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleResetPassword = () => {
    setIsOpen(false);
    setShowResetModal(true);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This will delete their portfolio and all associated data.")) {
      return;
    }
    setIsOpen(false);
    try {
      await deleteUser(user.id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="px-2 py-1 rounded text-xs font-medium bg-muted/10 text-muted hover:bg-muted/20 hover:text-foreground border border-border/50 transition-all flex items-center gap-1"
          title="Actions"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <MoreVertical className="h-3 w-3" />
          <span className="hidden sm:inline">Actions</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-panel border border-border rounded-lg shadow-xl z-[100] overflow-hidden">
            <div className="py-1">
              {user.portfolio?.slug && (
                <Link
                  href={`/portfolio/${user.portfolio.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-panel2 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <ExternalLink className="h-3 w-3" />
                  View Portfolio
                </Link>
              )}
              
              {user.portfolio && (
                <ImpersonateForm
                  portfolioId={user.portfolio.id}
                  isCurrentlyImpersonating={isCurrentlyImpersonating}
                  onImpersonate={onImpersonate}
                  onClose={() => setIsOpen(false)}
                />
              )}

              <div className="border-t border-border my-1" />

              <button
                type="button"
                onClick={handleResetPassword}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-panel2 transition-colors text-left"
              >
                <Key className="h-3 w-3" />
                Reset Password
              </button>

              {user.id !== currentUserId && (
                <>
                  <div className="border-t border-border my-1" />
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete User
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showResetModal && (
        <ResetPasswordModal
          userId={user.id}
          userEmail={user.email}
          onClose={() => setShowResetModal(false)}
        />
      )}
    </>
  );
}

function ResetPasswordModal({
  userId,
  userEmail,
  onClose,
}: {
  userId: string;
  userEmail: string;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [minPasswordLength, setMinPasswordLength] = useState(6);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    getMinPasswordLengthAction().then(setMinPasswordLength).catch(() => {
      setMinPasswordLength(6);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters long`);
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
        setTimeout(() => {
          onClose();
          setSuccess(null);
          router.refresh();
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reset password");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-panel border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            disabled={isPending}
          >
            <span className="sr-only">Close</span>
            ×
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
              disabled={isPending}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              required
              minLength={minPasswordLength}
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
              {isPending ? "Resetting..." : "Reset password"}
            </button>
            <button
              type="button"
              onClick={onClose}
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
