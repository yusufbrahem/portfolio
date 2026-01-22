"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";

/**
 * Request portfolio publication.
 * Changes status from DRAFT to READY_FOR_REVIEW.
 */
export async function requestPortfolioPublication() {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite();
  await assertNotImpersonatingForWrite();

  const portfolioId = session.user.portfolioId;
  if (!portfolioId) {
    throw new Error("User must have a portfolio to request publication");
  }

  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { status: "READY_FOR_REVIEW" },
  });

  revalidatePath("/admin");
  // Do NOT revalidate onboarding - request review is decoupled from onboarding
  return { success: true };
}
