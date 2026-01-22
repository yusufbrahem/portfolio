import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const IMPERSONATE_PORTFOLIO_COOKIE = "admin_impersonate_portfolio_id";

/**
 * Get the current authenticated session
 * Returns null if not authenticated
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in server components and server actions
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Require super admin (server-side).
 */
export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Access denied");
  }
  return session;
}

/**
 * Read current impersonation (super-admin only) from secure cookie.
 * This is used for READ paths only.
 */
export async function getImpersonatedPortfolioId(): Promise<string | null> {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") return null;

  const store = await cookies();
  const value = store.get(IMPERSONATE_PORTFOLIO_COOKIE)?.value;
  return value || null;
}

/**
 * Portfolio scope for admin READ operations.
 * - super_admin + impersonation => read only that portfolio
 * - super_admin (no impersonation) => read all portfolios (returns null)
 * - regular user => read their own portfolio only
 */
export async function getAdminReadScope(): Promise<{ portfolioId: string | null; isImpersonating: boolean }> {
  const session = await requireAuth();

  if (session.user.role === "super_admin") {
    const impersonated = await getImpersonatedPortfolioId();
    return { portfolioId: impersonated, isImpersonating: !!impersonated };
  }

  return { portfolioId: session.user.portfolioId || null, isImpersonating: false };
}

/**
 * Enforce read-only impersonation.
 * If super_admin is impersonating, all writes must be blocked.
 */
export async function assertNotImpersonatingForWrite(): Promise<void> {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") return;

  const impersonated = await getImpersonatedPortfolioId();
  if (impersonated) {
    throw new Error("Read-only mode: stop impersonating to make changes.");
  }
}

/**
 * Block ALL portfolio write operations for super_admin.
 * Super admin accounts are platform-only and cannot edit portfolio content.
 * This applies even when NOT impersonating.
 * 
 * PLATFORM HARDENING: Super admin is locked to platform management only.
 */
export async function assertNotSuperAdminForPortfolioWrite(): Promise<void> {
  const session = await requireAuth();
  if (session.user.role === "super_admin") {
    throw new Error("Super admin accounts are for platform management only. Portfolio editing is disabled.");
  }
}

/**
 * Get the current user ID from session
 * Throws if not authenticated
 */
export async function getUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}

/**
 * Check if user is authenticated (does not redirect)
 * Use this when you need to check auth status without redirecting
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Get the current user's portfolio ID from session
 * Returns null if user has no portfolio
 * Throws if not authenticated
 * 
 * NOTE: This does NOT filter data yet - it's just context resolution.
 * In future phases, we'll use this portfolioId to filter queries.
 */
export async function getCurrentPortfolioId(): Promise<string | null> {
  const session = await requireAuth();
  return session.user.portfolioId || null;
}

/**
 * Get the current user's portfolio object (full data)
 * Returns null if user has no portfolio
 * Throws if not authenticated
 * 
 * NOTE: This is for future use when we need full portfolio data.
 * Currently, data queries don't filter by portfolioId yet.
 */
export async function getCurrentPortfolio() {
  const session = await requireAuth();
  
  if (!session.user.portfolioId) {
    return null;
  }
  
  // Safe lookup - returns null if Portfolio model doesn't exist yet (pre-migration)
  try {
    // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
    return await prisma.portfolio.findUnique({
      where: { id: session.user.portfolioId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    // Portfolio model doesn't exist yet
    return null;
  }
}

/**
 * Ensure the current user has a portfolio
 * Creates a default portfolio if one doesn't exist
 * Returns the portfolio ID
 * 
 * NOTE: This will be useful in Phase 3 when we need to ensure
 * every user has a portfolio before they can create data.
 */
export async function ensureCurrentPortfolio(): Promise<string> {
  const session = await requireAuth();
  const userId = session.user.id;
  
  // Check if portfolio already exists
  if (session.user.portfolioId) {
    return session.user.portfolioId;
  }
  
  // Safe lookup - throws if Portfolio model doesn't exist yet (migration required)
  try {
    // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        slug: session.user.email.split("@")[0] || `user-${userId.slice(0, 8)}`,
        isPublished: false,
      },
    });
    
    return portfolio.id;
  } catch (error) {
    // Portfolio model doesn't exist yet - migration required
    throw new Error(
      "Portfolio model not found. Please run database migration first: " +
      "npm run db:migrate && npm run db:generate"
    );
  }
}
