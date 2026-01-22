"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin, assertNotImpersonatingForWrite } from "@/lib/auth";
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
    // Fully clear impersonation cookie with explicit path and maxAge=0
    store.delete(IMPERSONATE_PORTFOLIO_COOKIE);
    // Also set with maxAge=0 to ensure it's cleared across all paths
    store.set({
      name: IMPERSONATE_PORTFOLIO_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      maxAge: 0,
    });
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
          personInfo: {
            select: {
              avatarUrl: true,
              updatedAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return users;
}

/**
 * Super admin: delete a user and cascade delete their portfolio + all data.
 */
export async function deleteUser(userId: string) {
  const session = await requireSuperAdmin();

  // Verify user exists and is not the current super admin
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Prevent deleting yourself (safety check)
  if (user.id === session.user.id) {
    throw new Error("Cannot delete your own account");
  }

  // Cascade delete: user -> portfolio -> all related data (handled by Prisma onDelete: Cascade)
  await prisma.adminUser.delete({
    where: { id: userId },
  });

  return { success: true };
}

/**
 * Super admin: reset a user's password.
 * Does NOT require current password - super admin can reset any user's password.
 * Blocks during impersonation.
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await requireSuperAdmin();
  await assertNotImpersonatingForWrite(); // Block password resets during impersonation

  // Validate password length
  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long");
  }

  // Verify target user exists
  const targetUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.adminUser.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  revalidatePath("/admin/users");

  return { success: true, email: targetUser.email };
}

/**
 * Super admin: toggle portfolio publish status.
 */
export async function togglePortfolioPublish(portfolioId: string, isPublished: boolean) {
  await requireSuperAdmin();

  // Verify portfolio exists
  try {
    // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { id: true },
    });

    if (!portfolio) {
      throw new Error("Portfolio not found");
    }

    // @ts-expect-error - Portfolio model may not exist in Prisma Client until migration
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { isPublished },
    });

    return { success: true, isPublished };
  } catch (e) {
    throw new Error("Portfolio not found");
  }
}
