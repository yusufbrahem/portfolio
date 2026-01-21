"use client";

import { useState, useTransition } from "react";
import { createUser } from "@/app/actions/super-admin";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = (formData.get("role") as "user" | "super_admin") || "user";

    startTransition(async () => {
      try {
        await createUser({ email, password, name: name || undefined, role });
        // Reset form
        e.currentTarget.reset();
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
            required
            minLength={6}
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
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            defaultValue="user"
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
