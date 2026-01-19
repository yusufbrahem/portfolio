import { Container } from "@/components/container";
import Link from "next/link";
import { LogOut, Home, Briefcase, Code, FolderOpen, User, Settings } from "lucide-react";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if we're on login page (set by middleware)
  const headersList = await headers();
  const isLoginPage = headersList.get("x-is-login-page") === "true";
  
  // Skip admin UI for login page (middleware handles auth redirect)
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // For all other admin pages, middleware has already verified auth
  // Just render the admin UI

  // Render admin UI for authenticated users
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-panel">
        <Container className="py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-muted hover:text-foreground flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                View Site
              </Link>
              <form action={async () => {
                "use server";
                const { logout } = await import("@/app/actions/logout");
                await logout();
              }}>
                <button
                  type="submit"
                  className="text-sm text-muted hover:text-foreground flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </Container>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-border bg-panel min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <Settings className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/skills"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <Code className="h-4 w-4" />
              Skills
            </Link>
            <Link
              href="/admin/projects"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <FolderOpen className="h-4 w-4" />
              Projects
            </Link>
            <Link
              href="/admin/experience"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <Briefcase className="h-4 w-4" />
              Experience
            </Link>
            <Link
              href="/admin/about"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <User className="h-4 w-4" />
              About
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
