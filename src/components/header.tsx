import Link from "next/link";
import { Container } from "@/components/container";
import { Logo } from "@/components/logo";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "./logout-button";

export async function Header() {
  const session = await getSession();

  let portfolioSlug: string | null = null;
  let isPublished = false;

  if (session?.user) {
    // Fetch user's portfolio slug and publish status
    if (session.user.role === "super_admin") {
      // Super admin doesn't have a portfolio
      portfolioSlug = null;
    } else if (session.user.portfolioId) {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: session.user.portfolioId },
        select: { slug: true, isPublished: true },
      });
      portfolioSlug = portfolio?.slug || null;
      isPublished = portfolio?.isPublished || false;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-6">
          <Logo />

          <div className="flex items-center gap-4">
            {!session ? (
              // Not logged in
              <Link
                href="/admin"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Login
              </Link>
            ) : session.user.role === "super_admin" ? (
              // Super admin
              <>
                <Link
                  href="/admin/users"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Admin Panel
                </Link>
                <LogoutButton />
              </>
            ) : (
              // Normal user
              <>
                <Link
                  href="/admin"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  My Dashboard
                </Link>
                {portfolioSlug && isPublished && (
                  <Link
                    href={`/portfolio/${portfolioSlug}`}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    View My Portfolio
                  </Link>
                )}
                <LogoutButton />
              </>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
