"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite } from "@/lib/auth";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getPersonInfo(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.personInfo.findFirst({
    where,
  });
}

// Admin read - requires authentication
// Regular users see only their portfolio, super_admin sees all
export async function getPersonInfoForAdmin() {
  const session = await requireAuth();
  const currentPortfolioId = session.user.portfolioId;
  
  // Super admin can see any portfolio's person info
  if (session.user.role === "super_admin") {
    // Return first available (for now, in future could allow selection)
    return await prisma.personInfo.findFirst();
  }
  
  // Regular users: only their portfolio
  if (!currentPortfolioId) {
    return null; // No portfolio = no person info
  }
  
  return await prisma.personInfo.findFirst({
    where: { portfolioId: currentPortfolioId },
  });
}

export async function updatePersonInfo(data: {
  name: string;
  role: string;
  location: string;
  email: string;
  linkedIn: string;
  cvUrl?: string | null;
  avatarUrl?: string | null;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to update person info");
  }
  
  const existing = await prisma.personInfo.findFirst({
    where: { portfolioId },
  });
  
  // Ownership check: if existing person info, verify it belongs to user's portfolio
  if (existing && session.user.role !== "super_admin") {
    if (existing.portfolioId !== portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  const result = await prisma.personInfo.upsert({
    where: { id: existing?.id || `person-${portfolioId}` },
    update: data,
    create: {
      id: `person-${portfolioId}`,
      portfolioId,
      ...data,
    },
  });
  
  revalidatePath("/admin/contact");
  // Public portfolio pages are under /portfolio/:slug now; revalidate admin only.
  return result;
}
