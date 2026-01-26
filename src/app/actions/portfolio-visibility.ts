"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Update portfolio-level visibility (master control)
 */
export async function updatePortfolioVisibility(isPublic: boolean) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) {
    throw new Error("No portfolio found");
  }

  const result = await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { isPublic },
    select: {
      isPublic: true,
    },
  });

  // Revalidate portfolio pages
  revalidatePath("/portfolio");
  revalidatePath("/admin");

  return result;
}

/**
 * Get portfolio-level visibility
 */
export async function getPortfolioVisibility() {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) {
    return null;
  }

  return await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: {
      isPublic: true,
    },
  });
}
