"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, getAdminReadScope } from "@/lib/auth";

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
  await assertNotImpersonatingForWrite();

  const portfolioId = session.user.portfolioId;
  if (!portfolioId) {
    throw new Error("User must have a portfolio to update hero content");
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

