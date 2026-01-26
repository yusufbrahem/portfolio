"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SectionVisibility = {
  showAbout?: boolean;
  showSkills?: boolean;
  showProjects?: boolean;
  showExperience?: boolean;
  showArchitecture?: boolean;
  showContact?: boolean;
};

/**
 * Update section visibility settings for the current user's portfolio
 */
export async function updateSectionVisibility(data: SectionVisibility) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) {
    throw new Error("No portfolio found");
  }

  // Build update object with only provided fields
  const updateData: Partial<SectionVisibility> = {};
  if (data.showAbout !== undefined) updateData.showAbout = data.showAbout;
  if (data.showSkills !== undefined) updateData.showSkills = data.showSkills;
  if (data.showProjects !== undefined) updateData.showProjects = data.showProjects;
  if (data.showExperience !== undefined) updateData.showExperience = data.showExperience;
  if (data.showArchitecture !== undefined) updateData.showArchitecture = data.showArchitecture;
  if (data.showContact !== undefined) updateData.showContact = data.showContact;

  const result = await prisma.portfolio.update({
    where: { id: portfolioId },
    data: updateData,
    select: {
      showAbout: true,
      showSkills: true,
      showProjects: true,
      showExperience: true,
      showArchitecture: true,
      showContact: true,
    },
  });

  // Revalidate portfolio pages
  revalidatePath("/portfolio");
  revalidatePath("/admin");

  return result;
}

/**
 * Get section visibility settings for the current user's portfolio
 */
export async function getSectionVisibility() {
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
      showAbout: true,
      showSkills: true,
      showProjects: true,
      showExperience: true,
      showArchitecture: true,
      showContact: true,
    },
  });
}
