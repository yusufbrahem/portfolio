"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite, getAdminReadScope } from "@/lib/auth";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";

export async function getHeroContentForAdmin() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  const portfolioId =
    session.user.role === "super_admin" ? scope.portfolioId : session.user.portfolioId;

  if (!portfolioId) return null;

  return await prisma.heroContent.findUnique({
    where: { portfolioId },
  });
}

export async function updateHeroContent(data: {
  headline: string;
  subheadline: string;
  highlights: string[];
}) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();

  const portfolioId = session.user.portfolioId;
  if (!portfolioId) {
    throw new Error("User must have a portfolio to update hero content");
  }
  
  // Server-side length validation
  const headlineValidation = validateTextLength(data.headline, TEXT_LIMITS.HEADLINE, "Headline");
  if (!headlineValidation.isValid) {
    throw new Error(headlineValidation.error || "Headline exceeds maximum length");
  }
  
  const subheadlineValidation = validateTextLength(data.subheadline, TEXT_LIMITS.SUBHEADLINE, "Subheadline");
  if (!subheadlineValidation.isValid) {
    throw new Error(subheadlineValidation.error || "Subheadline exceeds maximum length");
  }
  
  // Validate highlights
  for (const highlight of data.highlights) {
    const highlightValidation = validateTextLength(highlight, TEXT_LIMITS.HIGHLIGHT, "Highlight");
    if (!highlightValidation.isValid) {
      throw new Error(highlightValidation.error || "Highlight exceeds maximum length");
    }
  }

  const result = await prisma.heroContent.upsert({
    where: { portfolioId },
    update: {
      headline: data.headline,
      subheadline: data.subheadline,
      highlights: JSON.stringify(data.highlights),
    },
    create: {
      id: `hero-${portfolioId}`,
      portfolioId,
      headline: data.headline,
      subheadline: data.subheadline,
      highlights: JSON.stringify(data.highlights),
    },
  });

  revalidatePath("/admin");
  return result;
}

