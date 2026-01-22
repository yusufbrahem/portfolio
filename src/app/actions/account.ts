"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";
import bcrypt from "bcryptjs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSlug(input: string) {
  const v = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-{2,}/g, "-");

  return v;
}

export async function updateMyAccount(data: { name?: string | null; email?: string | null }) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();

  const userId = session.user.id;

  const nextName = typeof data.name === "string" ? data.name.trim() : null;
  const nextEmailRaw = typeof data.email === "string" ? data.email : null;
  const nextEmail = nextEmailRaw ? normalizeEmail(nextEmailRaw) : null;

  if (nextEmail && !nextEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  // If email is changing, ensure uniqueness
  if (nextEmail && nextEmail !== session.user.email) {
    const existing = await prisma.adminUser.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });
    if (existing && existing.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: {
      ...(typeof nextName === "string" ? { name: nextName || null } : {}),
      ...(typeof nextEmail === "string" ? { email: nextEmail } : {}),
    },
    select: { id: true, email: true, name: true },
  });

  // Keep PersonInfo email in sync for this portfolio (if it exists)
  if (typeof nextEmail === "string" && session.user.portfolioId) {
    await prisma.personInfo.updateMany({
      where: { portfolioId: session.user.portfolioId },
      data: { email: nextEmail },
    });
  }

  revalidatePath("/admin/account");
  revalidatePath("/admin");

  return {
    user: updated,
    emailChanged: typeof nextEmail === "string" && nextEmail !== session.user.email,
  };
}

export async function getMyPortfolioSlug() {
  const session = await requireAuth();
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  return portfolio?.slug || "";
}

export async function updateMyPortfolioSlug(data: { slug: string }) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!portfolio) {
    throw new Error("No portfolio found for this account");
  }

  const nextSlug = normalizeSlug(data.slug);
  if (!nextSlug) {
    throw new Error("Slug cannot be empty");
  }
  if (nextSlug.length < 2) {
    throw new Error("Slug must be at least 2 characters");
  }

  const existing = await prisma.portfolio.findFirst({
    where: {
      slug: nextSlug,
      NOT: { id: portfolio.id },
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error("That URL is already taken");
  }

  await prisma.portfolio.update({
    where: { id: portfolio.id },
    data: { slug: nextSlug },
    select: { id: true },
  });

  revalidatePath("/admin/account");
  revalidatePath("/admin/users");

  return { slug: nextSlug };
}

/**
 * Change the current user's password.
 * Requires authentication and blocks during impersonation.
 */
export async function changeMyPassword(data: { currentPassword: string; newPassword: string }) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite(); // Block password changes during impersonation

  // Validate password length (configurable via MIN_PASSWORD_LENGTH env var)
  const { validatePasswordLength } = await import("@/lib/password-validation");
  validatePasswordLength(data.newPassword);

  // Get current user with password hash
  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify current password
  const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

  // Update password
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  revalidatePath("/admin/account");

  return { success: true };
}
