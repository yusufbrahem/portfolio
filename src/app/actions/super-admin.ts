"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

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

/**
 * Super admin: create a new user with email and password.
 * Auto-creates a portfolio for the new user.
 */
export async function createUser(data: { email: string; password: string; name?: string; role?: "user" | "super_admin" }) {
  await requireSuperAdmin();

  // Validate email format
  if (!data.email || !data.email.includes("@")) {
    throw new Error("Invalid email address");
  }

  // Validate password length
  if (!data.password || data.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Check if user already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user and portfolio in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.adminUser.create({
      data: {
        email: data.email,
        name: data.name || null,
        passwordHash,
        // @ts-expect-error - role may not exist in Prisma Client until migration
        role: data.role || "user",
      },
    });

    // Create portfolio for the user
    try {
      // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
      const portfolio = await tx.portfolio.create({
        data: {
          userId: user.id,
          slug: data.email.split("@")[0] || `user-${user.id.slice(0, 8)}`,
          isPublished: false,
        },
      });
      return { user, portfolio };
    } catch (e) {
      // Portfolio model doesn't exist yet - that's OK, user can create it later
      return { user, portfolio: null };
    }
  });

  return result;
}

/**
 * Super admin: get users with their portfolio info.
 * Combines listAllUsers and listAllPortfolios for UI display.
 */
export async function getUsersWithPortfolios() {
  await requireSuperAdmin();

  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      // @ts-expect-error - role may not exist in Prisma Client until migration
      role: true,
      createdAt: true,
      // @ts-expect-error - portfolio relation may not exist in Prisma Client until migration
      portfolio: {
        select: {
          id: true,
          slug: true,
          isPublished: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return users;
}
