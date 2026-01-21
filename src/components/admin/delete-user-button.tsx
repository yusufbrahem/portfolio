"use client";

import { useState, useTransition } from "react";
import { deleteUser } from "@/app/actions/super-admin";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this user? This will delete their portfolio and all associated data.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteUser(userId);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete user");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
      Delete
    </button>
  );
}
