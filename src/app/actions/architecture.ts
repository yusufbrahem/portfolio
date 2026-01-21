"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite } from "@/lib/auth";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getArchitectureContent(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.architectureContent.findFirst({
    where,
    include: {
      pillars: {
        include: {
          points: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

// Admin read - requires authentication
// Regular users see only their portfolio, super_admin sees all
export async function getArchitectureContentForAdmin() {
  const session = await requireAuth();
  const currentPortfolioId = session.user.portfolioId;
  
  // Super admin can see any portfolio's architecture content
  if (session.user.role === "super_admin") {
    // Return first available (for now, in future could allow selection)
    return await prisma.architectureContent.findFirst({
      include: {
        pillars: {
          include: {
            points: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
  }
  
  // Regular users: only their portfolio
  if (!currentPortfolioId) {
    return null; // No portfolio = no architecture content
  }
  
  return await prisma.architectureContent.findFirst({
    where: { portfolioId: currentPortfolioId },
    include: {
      pillars: {
        include: {
          points: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function ensureArchitectureContent() {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to create architecture content");
  }
  
  const existing = await prisma.architectureContent.findFirst({
    where: { portfolioId },
  });
  
  if (existing) return existing;
  
  return await prisma.architectureContent.create({
    data: {
      id: `arch-${portfolioId}`,
      portfolioId,
    },
  });
}

export async function createPillar(data: {
  architectureContentId: string;
  title: string;
  order: number;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify parent resource exists and user has access
  const parent = await prisma.architectureContent.findUnique({ 
    where: { id: data.architectureContentId },
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
  
  const result = await prisma.architecturePillar.create({
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function updatePillar(
  id: string,
  data: { title?: string; order?: number }
) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get parent portfolioId
  const existing = await prisma.architecturePillar.findUnique({ 
    where: { id },
    include: {
      architectureContent: {
        select: { portfolioId: true },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can update any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.architectureContent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  const result = await prisma.architecturePillar.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function deletePillar(id: string) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get parent portfolioId
  const existing = await prisma.architecturePillar.findUnique({ 
    where: { id },
    include: {
      architectureContent: {
        select: { portfolioId: true },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can delete any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.architectureContent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  await prisma.architecturePillar.delete({
    where: { id },
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
}

export async function createPoint(data: {
  architecturePillarId: string;
  text: string;
  order: number;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify parent resource exists and get grandparent portfolioId
  const parent = await prisma.architecturePillar.findUnique({ 
    where: { id: data.architecturePillarId },
    include: {
      architectureContent: {
        select: { portfolioId: true },
      },
    },
  });
  
  if (!parent) {
    throw new Error("Parent resource not found");
  }
  
  // Ownership check: super_admin can create in any portfolio, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || parent.architectureContent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  const result = await prisma.architecturePoint.create({
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function updatePoint(
  id: string,
  data: { text?: string; order?: number }
) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get grandparent portfolioId
  const existing = await prisma.architecturePoint.findUnique({ 
    where: { id },
    include: {
      architecturePillar: {
        include: {
          architectureContent: {
            select: { portfolioId: true },
          },
        },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can update any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.architecturePillar.architectureContent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  const result = await prisma.architecturePoint.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function deletePoint(id: string) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get grandparent portfolioId
  const existing = await prisma.architecturePoint.findUnique({ 
    where: { id },
    include: {
      architecturePillar: {
        include: {
          architectureContent: {
            select: { portfolioId: true },
          },
        },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can delete any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.architecturePillar.architectureContent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  await prisma.architecturePoint.delete({
    where: { id },
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
}
