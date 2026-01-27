import { Container } from "@/components/container";
import Link from "next/link";
import { LogOut, Home, Briefcase, Code, FolderOpen, User, Settings, Building2, Mail, Users, CircleUser, Sparkles, Menu } from "lucide-react";
import { headers } from "next/headers";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { getPendingReviewCount } from "@/app/actions/portfolio-review";
import { getEnabledAdminMenus } from "@/app/actions/menu-helpers";

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
  
  // Side menu: only menus this portfolio has enabled (PortfolioMenu.visible) and platform has enabled. All are active and clickable.
  let enabledMenus: Array<{ key: string; label: string; route: string }> = [];
  const scope = await getAdminReadScope();
  const effectivePortfolioId = scope.portfolioId ?? session.user.portfolioId ?? null;
  if (session.user.role !== "super_admin" || scope.portfolioId) {
    enabledMenus = await getEnabledAdminMenus(effectivePortfolioId);
  }

  const isReadOnly = scope.isImpersonating;

  // Get pending review count for super admin
  let pendingReviewCount = 0;
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    try {
      pendingReviewCount = await getPendingReviewCount();
    } catch {
      // Ignore errors
    }
  }

  let activePortfolioLabel: string = "—";
  let avatarUrl: string | null = null;
  
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
      // Get avatar for this portfolio (portfolio has many personInfos; use first for header avatar)
      if (p?.id) {
        const personInfo = await prisma.personInfo.findFirst({
          where: { portfolioId: p.id },
          select: { avatarUrl: true, updatedAt: true },
        });
        const url = (personInfo as any)?.avatarUrl;
        avatarUrl = url ? `${url}?t=${new Date((personInfo as any).updatedAt).getTime()}` : null;
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
        select: { slug: true, id: true },
      });
      activePortfolioLabel = p?.slug || session.user.email.split("@")[0] || "Portfolio";
      // Get avatar for this portfolio (portfolio has many personInfos; use first for header avatar)
      if (p?.id) {
        const personInfo = await prisma.personInfo.findFirst({
          where: { portfolioId: p.id },
          select: { avatarUrl: true, updatedAt: true },
        });
        const url = (personInfo as any)?.avatarUrl;
        avatarUrl = url ? `${url}?t=${new Date((personInfo as any).updatedAt).getTime()}` : null;
      }
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
          <div className="mb-4">
            <Logo className="text-sm" />
          </div>
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
            <div className="flex items-center gap-4">
              {avatarUrl && (
                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border bg-panel2 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                </div>
              )}
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
            {/* PLATFORM HARDENING: Super admin (not impersonating) sees ONLY Users management */}
            {session.user.role === "super_admin" && !scope.portfolioId ? (
              // Super admin not impersonating: platform-only UI
              <>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg relative"
                >
                  <Users className="h-4 w-4" />
                  Users
                  {pendingReviewCount > 0 && (
                    <span className="ml-auto bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingReviewCount > 9 ? "9+" : pendingReviewCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/platform-menus"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
                >
                  <Menu className="h-4 w-4" />
                  Platform Menus
                </Link>
              </>
            ) : (
              // Regular users OR super admin impersonating: full portfolio management UI
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
                >
                  <Settings className="h-4 w-4" />
                  Dashboard
                </Link>
                {/* Render menu links: every item is active (visible + platform enabled) and clickable */}
                {enabledMenus.map((menu) => {
                  const iconMap: Record<string, React.ReactNode> = {
                    skills: <Code className="h-4 w-4" />,
                    projects: <FolderOpen className="h-4 w-4" />,
                    experience: <Briefcase className="h-4 w-4" />,
                    about: <User className="h-4 w-4" />,
                    architecture: <Building2 className="h-4 w-4" />,
                    contact: <Mail className="h-4 w-4" />,
                  };
                  return (
                    <Link
                      key={menu.key}
                      href={menu.route}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
                    >
                      {iconMap[menu.key] || <Menu className="h-4 w-4" />}
                      {menu.label}
                    </Link>
                  );
                })}
                <Link
                  href="/admin/hero"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
                >
                  <Sparkles className="h-4 w-4" />
                  Hero
                </Link>
                <Link
                  href="/admin/menus"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg"
                >
                  <Menu className="h-4 w-4" />
                  Menu Configuration
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-foreground rounded-lg relative"
                  >
                    <Users className="h-4 w-4" />
                    Users
                    {pendingReviewCount > 0 && (
                      <span className="ml-auto bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingReviewCount > 9 ? "9+" : pendingReviewCount}
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
