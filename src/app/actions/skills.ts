"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getSkillGroups(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.skillGroup.findMany({
    where,
    include: {
      skills: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

// Admin read - requires authentication; scoped to portfolio + platform menu (section instance)
export async function getSkillGroupsForAdmin(platformMenuId: string) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) return [];

  return await prisma.skillGroup.findMany({
    where: { portfolioId, platformMenuId },
    include: {
      skills: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  });
}

export async function createSkillGroup(data: { name: string; order: number; platformMenuId: string }) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;

  if (!portfolioId) throw new Error("User must have a portfolio to create skill groups");

  const nameValidation = validateTextLength(data.name, TEXT_LIMITS.NAME, "Skill group name");
  if (!nameValidation.isValid) throw new Error(nameValidation.error || "Skill group name exceeds maximum length");

  const { platformMenuId, ...rest } = data;
  const result = await prisma.skillGroup.create({
    data: { ...rest, portfolioId, platformMenuId },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/admin/sections");
  revalidatePath("/skills");
  return result;
}

export async function updateSkillGroup(id: string, data: { name?: string; order?: number }) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and user has access
  const existing = await prisma.skillGroup.findUnique({ 
    where: { id },
    select: { portfolioId: true },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can update any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  // Server-side length validation
  if (data.name !== undefined) {
    const nameValidation = validateTextLength(data.name, TEXT_LIMITS.NAME, "Skill group name");
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error || "Skill group name exceeds maximum length");
    }
  }
  
  const result = await prisma.skillGroup.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function deleteSkillGroup(id: string) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and user has access
  const existing = await prisma.skillGroup.findUnique({ 
    where: { id },
    select: { portfolioId: true },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can delete any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  await prisma.skillGroup.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}

export async function createSkill(data: { skillGroupId: string; name: string; order: number }) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  
  // Verify parent resource exists and user has access
  const parent = await prisma.skillGroup.findUnique({ 
    where: { id: data.skillGroupId },
    select: { portfolioId: true },
  });
  
  if (!parent) {
    throw new Error("Parent resource not found");
  }
  
  // Ownership check: super_admin can create in any portfolio, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || parent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  // Server-side length validation
  const nameValidation = validateTextLength(data.name, TEXT_LIMITS.TAG, "Skill name");
  if (!nameValidation.isValid) {
    throw new Error(nameValidation.error || "Skill name exceeds maximum length");
  }
  
  const result = await prisma.skill.create({
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkill(id: string, data: { name?: string; order?: number; skillGroupId?: string }) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get parent portfolioId
  const existing = await prisma.skill.findUnique({ 
    where: { id },
    include: {
      skillGroup: {
        select: { portfolioId: true },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // If skillGroupId is being changed, verify access to new parent
  if (data.skillGroupId && data.skillGroupId !== existing.skillGroupId) {
    const newParent = await prisma.skillGroup.findUnique({
      where: { id: data.skillGroupId },
      select: { portfolioId: true },
    });
    
    if (!newParent) {
      throw new Error("Target skill group not found");
    }
    
    // Ownership check: super_admin can move to any portfolio, users only their own
    if (session.user.role !== "super_admin") {
      if (!session.user.portfolioId || newParent.portfolioId !== session.user.portfolioId) {
        throw new Error("Access denied");
      }
    }
  }
  
  // Ownership check: super_admin can update any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.skillGroup.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  // Server-side length validation
  if (data.name !== undefined) {
    const nameValidation = validateTextLength(data.name, TEXT_LIMITS.TAG, "Skill name");
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error || "Skill name exceeds maximum length");
    }
  }
  
  const result = await prisma.skill.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function deleteSkill(id: string) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get parent portfolioId
  const existing = await prisma.skill.findUnique({ 
    where: { id },
    include: {
      skillGroup: {
        select: { portfolioId: true },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can delete any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.skillGroup.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  await prisma.skill.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}
