import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { signOut } = await import("@/auth");
        await signOut({ redirectTo: "/admin/login" });
      }}
      className="inline"
    >
      <button
        type="submit"
        className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </form>
  );
}
