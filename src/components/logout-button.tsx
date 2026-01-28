import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/logout";

export function LogoutButton() {
  return (
    <form action={logout} className="inline">
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
