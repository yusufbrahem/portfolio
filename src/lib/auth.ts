import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
