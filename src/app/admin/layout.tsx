import { Container } from "@/components/container";
import Link from "next/link";
import { LogOut, Home, Briefcase, Code, FolderOpen, User, Settings, Building2, Mail, Users, CircleUser } from "lucide-react";
import { headers } from "next/headers";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
  
  // Defense in depth: Verify authentication again at layout level
  // Middleware protects routes, but this adds an extra layer
  const session = await requireAuth();

  // Resolve active admin read scope (supports super-admin impersonation)
  const scope = await getAdminReadScope();
  const isReadOnly = scope.isImpersonating;

  let activePortfolioLabel: string = "—";
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    activePortfolioLabel = "All portfolios";
  } else if (scope.portfolioId) {
    try {
      // Prefer slug if available, fallback to user email, never show raw UUID
      // @ts-expect-error - Prisma Client may be stale in editor until TS server refresh; DB is aligned.
      const p = await prisma.portfolio.findUnique({
        where: { id: scope.portfolioId },
        select: { id: true, slug: true, user: { select: { email: true } } },
      });
      if (p?.slug) {
        activePortfolioLabel = p.slug;
      } else if (p?.user?.email) {
        activePortfolioLabel = p.user.email.split("@")[0] || p.user.email;
      } else {
        activePortfolioLabel = "Portfolio";
      }
    } catch {
      activePortfolioLabel = "Portfolio";
    }
  } else if (session.user.portfolioId) {
    // Regular user fallback - try to get slug or use email
    try {
      // @ts-expect-error - Prisma Client may be stale in editor until TS server refresh; DB is aligned.
      const p = await prisma.portfolio.findUnique({
        where: { id: session.user.portfolioId },
        select: { slug: true },
      });
      activePortfolioLabel = p?.slug || session.user.email.split("@")[0] || "Portfolio";
    } catch {
      activePortfolioLabel = session.user.email.split("@")[0] || "Portfolio";
    }
  }
  
  // For all other admin pages, both middleware and layout have verified auth
  // Render the admin UI

  // Render admin UI for authenticated users
  return (
    <div className="min-h-screen bg-background" data-admin-readonly={isReadOnly ? "true" : "false"}>
      <header className="border-b border-border bg-panel">
        <Container className="py-4">
          {isReadOnly ? (
            <div className="mb-3 rounded-lg border border-border bg-panel2 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                READ-ONLY — impersonation active
              </p>
              <p className="mt-1 text-xs text-muted">
                You are viewing another portfolio’s data. Writes are blocked until impersonation is cleared.
              </p>
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span>
                  <span className="text-muted-disabled">User:</span>{" "}
                  <span className="text-foreground">{session.user.email}</span>
                </span>
                <span>
                  <span className="text-muted-disabled">Role:</span>{" "}
                  <span className="text-foreground">{session.user.role}</span>
                </span>
                <span>
                  <span className="text-muted-disabled">Portfolio:</span>{" "}
                  <span className="text-foreground">{activePortfolioLabel}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <Link
                href="/"
                className="text-sm text-muted hover:text-foreground flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                View Site
              </Link>
              <form action={async () => {
                "use server";
                const { signOut } = await import("@/auth");
                await signOut({ redirectTo: "/admin/login" });
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
            <Link
              href="/admin/architecture"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <Building2 className="h-4 w-4" />
              Architecture
            </Link>
            <Link
              href="/admin/contact"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <Mail className="h-4 w-4" />
              Contact
            </Link>
            <Link
              href="/admin/account"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
            >
              <CircleUser className="h-4 w-4" />
              Account
            </Link>
            {session.user.role === "super_admin" && (
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
