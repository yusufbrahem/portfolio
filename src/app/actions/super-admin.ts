"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/lib/auth";

const IMPERSONATE_PORTFOLIO_COOKIE = "admin_impersonate_portfolio_id";

/**
 * Super admin: view all users (minimal fields).
 */
export async function listAllUsers() {
  await requireSuperAdmin();
  return await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      // @ts-expect-error - role may not exist in Prisma Client until migration
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Super admin: view all portfolios (minimal fields).
 */
export async function listAllPortfolios() {
  await requireSuperAdmin();
  // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
  return await prisma.portfolio.findMany({
    select: {
      id: true,
      slug: true,
      isPublished: true,
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          // @ts-expect-error - role may not exist in Prisma Client until migration
          role: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Super admin: impersonate portfolio context (READ ONLY).
 * Stores portfolio id in secure, httpOnly cookie under /admin.
 */
export async function setImpersonatedPortfolioId(portfolioId: string | null) {
  await requireSuperAdmin();

  const store = await cookies();
  if (!portfolioId) {
    store.delete(IMPERSONATE_PORTFOLIO_COOKIE);
    return { success: true, portfolioId: null };
  }

  // Validate portfolio exists (and avoid setting arbitrary IDs)
  try {
    // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
    const exists = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { id: true },
    });
    if (!exists) {
      throw new Error("Portfolio not found");
    }
  } catch (e) {
    throw new Error("Portfolio not found");
  }

  store.set({
    name: IMPERSONATE_PORTFOLIO_COOKIE,
    value: portfolioId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
  });

  return { success: true, portfolioId };
}

