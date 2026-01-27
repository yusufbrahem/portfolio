"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";

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

// Admin read - requires authentication; scoped to portfolio + platform menu (section instance)
export async function getAboutContentForAdmin(platformMenuId: string) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) return null;

  return await prisma.aboutContent.findFirst({
    where: { portfolioId, platformMenuId },
    include: {
      principles: { orderBy: { order: "asc" } },
    },
  });
}

export async function updateAboutContent(data: {
  title: string;
  paragraphs: string[];
  platformMenuId: string;
}) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;

  if (!portfolioId) throw new Error("User must have a portfolio to update about content");

  const titleValidation = validateTextLength(data.title, TEXT_LIMITS.TITLE, "Title");
  if (!titleValidation.isValid) throw new Error(titleValidation.error || "Title exceeds maximum length");

  for (const para of data.paragraphs) {
    if (para.length > TEXT_LIMITS.LONG_TEXT) {
      throw new Error(`Paragraph exceeds maximum length of ${TEXT_LIMITS.LONG_TEXT} characters`);
    }
  }

  const { platformMenuId, ...content } = data;
  const result = await prisma.aboutContent.upsert({
    where: { portfolioId_platformMenuId: { portfolioId, platformMenuId } },
    update: {
      title: content.title,
      paragraphs: JSON.stringify(content.paragraphs),
    },
    create: {
      portfolioId,
      platformMenuId,
      title: content.title,
      paragraphs: JSON.stringify(content.paragraphs),
    },
  });

  revalidatePath("/admin/about");
  revalidatePath("/admin/sections");
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
  
  // Server-side length validation
  if (data.title !== undefined) {
    const titleValidation = validateTextLength(data.title, TEXT_LIMITS.TITLE, "Principle title");
    if (!titleValidation.isValid) {
      throw new Error(titleValidation.error || "Principle title exceeds maximum length");
    }
  }
  
  if (data.description !== undefined) {
    const descriptionValidation = validateTextLength(data.description, TEXT_LIMITS.DESCRIPTION, "Principle description");
    if (!descriptionValidation.isValid) {
      throw new Error(descriptionValidation.error || "Principle description exceeds maximum length");
    }
  }
  
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
