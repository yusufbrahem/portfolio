"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Update item visibility for SkillGroup
 */
export async function updateSkillGroupVisibility(skillGroupId: string, isVisible: boolean) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) {
    throw new Error("No portfolio found");
  }

  // Verify the skill group belongs to this portfolio
  const skillGroup = await prisma.skillGroup.findFirst({
    where: {
      id: skillGroupId,
      portfolioId,
    },
  });

  if (!skillGroup) {
    throw new Error("Skill group not found");
  }

  const result = await prisma.skillGroup.update({
    where: { id: skillGroupId },
    data: { isVisible },
    select: {
      id: true,
      isVisible: true,
    },
  });

  revalidatePath("/portfolio");
  revalidatePath("/admin/skills");

  return result;
}

/**
 * Update item visibility for Project
 */
export async function updateProjectVisibility(projectId: string, isVisible: boolean) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) {
    throw new Error("No portfolio found");
  }

  // Verify the project belongs to this portfolio
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      portfolioId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const result = await prisma.project.update({
    where: { id: projectId },
    data: { isVisible },
    select: {
      id: true,
      isVisible: true,
    },
  });

  revalidatePath("/portfolio");
  revalidatePath("/admin/projects");

  return result;
}

/**
 * Update item visibility for Experience
 */
export async function updateExperienceVisibility(experienceId: string, isVisible: boolean) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) {
    throw new Error("No portfolio found");
  }

  // Verify the experience belongs to this portfolio
  const experience = await prisma.experience.findFirst({
    where: {
      id: experienceId,
      portfolioId,
    },
  });

  if (!experience) {
    throw new Error("Experience not found");
  }

  const result = await prisma.experience.update({
    where: { id: experienceId },
    data: { isVisible },
    select: {
      id: true,
      isVisible: true,
    },
  });

  revalidatePath("/portfolio");
  revalidatePath("/admin/experience");

  return result;
}

/**
 * Update item visibility for ArchitecturePillar
 */
export async function updateArchitecturePillarVisibility(pillarId: string, isVisible: boolean) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) {
    throw new Error("No portfolio found");
  }

  // Verify the pillar belongs to this portfolio's architecture content
  const architectureContent = await prisma.architectureContent.findFirst({
    where: { portfolioId },
    select: { id: true },
  });

  if (!architectureContent) {
    throw new Error("Architecture content not found");
  }

  const pillar = await prisma.architecturePillar.findFirst({
    where: {
      id: pillarId,
      architectureContentId: architectureContent.id,
    },
  });

  if (!pillar) {
    throw new Error("Architecture pillar not found");
  }

  const result = await prisma.architecturePillar.update({
    where: { id: pillarId },
    data: { isVisible },
    select: {
      id: true,
      isVisible: true,
    },
  });

  revalidatePath("/portfolio");
  revalidatePath("/admin/architecture");

  return result;
}
