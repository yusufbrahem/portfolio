"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getPersonInfo(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.personInfo.findFirst({
    where,
  });
}

// Admin read - requires authentication
// Regular users see only their portfolio, super_admin sees all (or impersonated portfolio)
export async function getPersonInfoForAdmin() {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;
  
  // If no portfolio ID (super admin not impersonating and no own portfolio), return null
  if (!portfolioId) {
    return null;
  }
  
  return await prisma.personInfo.findFirst({
    where: { portfolioId },
  });
}

export async function updatePersonInfo(data: {
  name: string;
  role: string;
  location: string;
  email: string;
  linkedIn: string;
  phone?: string | null;
  contactMessage?: string | null;
  cvUrl?: string | null;
  avatarUrl?: string | null;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to update person info");
  }
  
  // Validate and normalize phone number
  let normalizedPhone: string | null = null;
  if (data.phone && data.phone.trim()) {
    try {
      if (!isValidPhoneNumber(data.phone)) {
        throw new Error("Invalid phone number format. Please check the number and country code.");
      }
      const parsed = parsePhoneNumber(data.phone);
      normalizedPhone = parsed.number; // E.164 format
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid phone")) {
        throw error;
      }
      throw new Error("Invalid phone number format. Please check the number and country code.");
    }
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
  
  // Normalize contactMessage: empty strings become null
  const normalizedContactMessage = data.contactMessage?.trim() || null;
  
  const result = await prisma.personInfo.upsert({
    where: { id: existing?.id || `person-${portfolioId}` },
    update: {
      ...data,
      phone: normalizedPhone,
      contactMessage: normalizedContactMessage,
    },
    create: {
      id: `person-${portfolioId}`,
      portfolioId,
      ...data,
      phone: normalizedPhone,
      contactMessage: normalizedContactMessage,
    },
  });
  
  revalidatePath("/admin/contact");
  // Public portfolio pages are under /portfolio/:slug now; revalidate admin only.
  return result;
}
