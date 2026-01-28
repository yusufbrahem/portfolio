"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";

/**
 * Approve a portfolio for publication.
 * Changes status from READY_FOR_REVIEW to PUBLISHED.
 */
export async function approvePortfolio(portfolioId: string) {
  await requireSuperAdmin();

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { id: true, status: true },
  });

  if (!portfolio) {
    throw new Error("Portfolio not found");
  }

  if (portfolio.status !== "READY_FOR_REVIEW") {
    throw new Error("Portfolio is not pending review");
  }

  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { 
      status: "PUBLISHED",
      rejectionReason: null, // Clear any previous rejection reason
      approvedAt: new Date(), // Set timestamp when super admin approves
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Reject a portfolio.
 * Changes status from READY_FOR_REVIEW to REJECTED and stores rejection reason.
 */
export async function rejectPortfolio(portfolioId: string, reason: string) {
  await requireSuperAdmin();

  if (!reason || reason.trim().length === 0) {
    throw new Error("Rejection reason is required");
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { id: true, status: true },
  });

  if (!portfolio) {
    throw new Error("Portfolio not found");
  }

  if (portfolio.status !== "READY_FOR_REVIEW") {
    throw new Error("Portfolio is not pending review");
  }

  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { 
      status: "REJECTED",
      rejectionReason: reason.trim(),
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Get all portfolios pending review.
 */
export async function getPendingReviewPortfolios() {
  await requireSuperAdmin();

  const portfolios = await prisma.portfolio.findMany({
    where: { status: "READY_FOR_REVIEW" },
    select: {
      id: true,
      slug: true,
      status: true,
      rejectionReason: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      personInfos: {
        select: {
          name: true,
          role: true,
          avatarUrl: true,
          updatedAt: true,
        },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return portfolios.map((p: typeof portfolios[number]) => ({
    ...p,
    personInfo: p.personInfos?.[0] ?? null,
    personInfos: undefined,
  }));
}

/**
 * Get count of portfolios pending review.
 */
export async function getPendingReviewCount() {
  await requireSuperAdmin();

  return await prisma.portfolio.count({
    where: { status: "READY_FOR_REVIEW" },
  });
}
