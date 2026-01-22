"use client";

import { useState, useTransition, useEffect } from "react";
import { createUser, setImpersonatedPortfolioId } from "@/app/actions/super-admin";
import { getMinPasswordLengthAction } from "@/app/actions/password-validation";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "super_admin">("user");
  const [error, setError] = useState("");
  const [minPasswordLength, setMinPasswordLength] = useState(6); // Default fallback
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Fetch minimum password length from server
  useEffect(() => {
    getMinPasswordLengthAction().then(setMinPasswordLength).catch(() => {
      // Fallback to 6 if fetch fails
      setMinPasswordLength(6);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters long`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        await createUser({ email, password, name: name || undefined, role });
        // Auto-stop impersonation if active (after creating user, super admin should see all)
        try {
          await setImpersonatedPortfolioId(null);
        } catch {
          // Ignore errors from clearing impersonation
        }
        // Reset form using controlled state
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setRole("user");
        // Refresh the page to show new user
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create user");
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5" />
        Create New User
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Password *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={minPasswordLength}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-muted-disabled">
            Must be at least {minPasswordLength} characters long.
          </p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={minPasswordLength}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Name (optional)
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "user" | "super_admin")}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          >
            <option value="user">User</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div className="md:col-span-4">
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
