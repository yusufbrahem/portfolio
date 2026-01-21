"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite } from "@/lib/auth";

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

// Admin read - requires authentication
// Regular users see only their portfolio, super_admin sees all
export async function getSkillGroupsForAdmin() {
  const session = await requireAuth();
  const currentPortfolioId = session.user.portfolioId;
  
  // Super admin can see all portfolios' skills
  if (session.user.role === "super_admin") {
    return await prisma.skillGroup.findMany({
      include: {
        skills: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
  }
  
  // Regular users: only their portfolio
  if (!currentPortfolioId) {
    return []; // No portfolio = no skills
  }
  
  return await prisma.skillGroup.findMany({
    where: { portfolioId: currentPortfolioId },
    include: {
      skills: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

export async function createSkillGroup(data: { name: string; order: number }) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to create skill groups");
  }
  
  // Ownership check: ensure user owns this portfolio
  // Super admin can create in any portfolio, but for now they create in their own
  const result = await prisma.skillGroup.create({
    data: {
      ...data,
      portfolioId,
    },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkillGroup(id: string, data: { name?: string; order?: number }) {
  const session = await requireAuth();
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
  
  const result = await prisma.skill.create({
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkill(id: string, data: { name?: string; order?: number; skillGroupId?: string }) {
  const session = await requireAuth();
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
