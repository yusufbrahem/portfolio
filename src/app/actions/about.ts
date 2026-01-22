"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getAboutContent(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.aboutContent.findFirst({
    where,
    include: {
      principles: {
        orderBy: { order: "asc" },
      },
    },
  });
}

// Admin read - requires authentication
// Regular users see only their portfolio, super_admin sees all (or impersonated portfolio)
export async function getAboutContentForAdmin() {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;
  
  // If no portfolio ID (super admin not impersonating and no own portfolio), return null
  if (!portfolioId) {
    return null;
  }
  
  return await prisma.aboutContent.findFirst({
    where: { portfolioId },
    include: {
      principles: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function updateAboutContent(data: {
  title: string;
  paragraphs: string[];
}) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to update about content");
  }
  
  const existing = await prisma.aboutContent.findFirst({
    where: { portfolioId },
  });
  
  // Ownership check: if existing content, verify it belongs to user's portfolio
  if (existing && session.user.role !== "super_admin") {
    if (existing.portfolioId !== portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  const result = await prisma.aboutContent.upsert({
    where: { id: existing?.id || `about-${portfolioId}` },
    update: {
      title: data.title,
      paragraphs: JSON.stringify(data.paragraphs),
    },
    create: {
      id: `about-${portfolioId}`,
      portfolioId,
      title: data.title,
      paragraphs: JSON.stringify(data.paragraphs),
    },
  });
  
  revalidatePath("/admin/about");
  revalidatePath("/about");
  return result;
}

export async function createPrinciple(data: {
  aboutContentId: string;
  title: string;
  description: string;
  order: number;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify parent resource exists and user has access
  const parent = await prisma.aboutContent.findUnique({ 
    where: { id: data.aboutContentId },
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
  
  const result = await prisma.aboutPrinciple.create({
    data,
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
  return result;
}

export async function updatePrinciple(
  id: string,
  data: { title?: string; description?: string; order?: number }
) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get parent portfolioId
  const existing = await prisma.aboutPrinciple.findUnique({ 
    where: { id },
    include: {
      aboutContent: {
        select: { portfolioId: true },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can update any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.aboutContent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  const result = await prisma.aboutPrinciple.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
  return result;
}

export async function deletePrinciple(id: string) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and get parent portfolioId
  const existing = await prisma.aboutPrinciple.findUnique({ 
    where: { id },
    include: {
      aboutContent: {
        select: { portfolioId: true },
      },
    },
  });
  
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can delete any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || existing.aboutContent.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  await prisma.aboutPrinciple.delete({
    where: { id },
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
}
