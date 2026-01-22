"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";

export async function updatePortfolioIntros(data: {
  skillsIntro?: string | null;
  projectsIntro?: string | null;
  experienceIntro?: string | null;
  architectureIntro?: string | null;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  await assertNotSuperAdminForPortfolioWrite();
  
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to update section introductions");
  }
  
  const updateData: {
    skillsIntro?: string | null;
    projectsIntro?: string | null;
    experienceIntro?: string | null;
    architectureIntro?: string | null;
  } = {};
  
  if (data.skillsIntro !== undefined) {
    updateData.skillsIntro = data.skillsIntro?.trim() || null;
  }
  if (data.projectsIntro !== undefined) {
    updateData.projectsIntro = data.projectsIntro?.trim() || null;
  }
  if (data.experienceIntro !== undefined) {
    updateData.experienceIntro = data.experienceIntro?.trim() || null;
  }
  if (data.architectureIntro !== undefined) {
    updateData.architectureIntro = data.architectureIntro?.trim() || null;
  }
  
  const result = await prisma.portfolio.update({
    where: { id: portfolioId },
    data: updateData,
    select: {
      skillsIntro: true,
      projectsIntro: true,
      experienceIntro: true,
      architectureIntro: true,
    },
  });
  
  revalidatePath("/admin");
  revalidatePath("/admin/section-intros");
  // Revalidate public portfolio pages
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { slug: true },
  });
  if (portfolio?.slug) {
    revalidatePath(`/portfolio/${portfolio.slug}`);
  }
  
  return result;
}

export async function getPortfolioIntros() {
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
      skillsIntro: true,
      projectsIntro: true,
      experienceIntro: true,
      architectureIntro: true,
    },
  });
}
