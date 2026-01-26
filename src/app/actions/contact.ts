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
  email: string; // Legacy field, kept for backward compatibility
  linkedIn: string;
  phone?: string | null; // Legacy field, kept for backward compatibility
  contactMessage?: string | null;
  cvUrl?: string | null;
  avatarUrl?: string | null;
  // Extended contact fields
  phone1?: string | null;
  phone2?: string | null;
  whatsapp?: string | null;
  email1?: string | null;
  email2?: string | null;
  // Visibility controls
  showPhone1?: boolean;
  showPhone2?: boolean;
  showWhatsApp?: boolean;
  showEmail1?: boolean;
  showEmail2?: boolean;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to update person info");
  }
  
  // Validate and normalize phone numbers (legacy and new fields)
  const normalizePhone = (phone: string | null | undefined): string | null => {
    if (!phone || !phone.trim()) return null;
    try {
      if (!isValidPhoneNumber(phone)) {
        return null; // Invalid, but don't throw - validation happens in UI
      }
      const parsed = parsePhoneNumber(phone);
      return parsed.number; // E.164 format
    } catch {
      return null; // Invalid, but don't throw - validation happens in UI
    }
  };
  
  const normalizedPhone = normalizePhone(data.phone);
  const normalizedPhone1 = normalizePhone(data.phone1);
  const normalizedPhone2 = normalizePhone(data.phone2);
  const normalizedWhatsApp = normalizePhone(data.whatsapp);
  
  // Normalize emails (trim whitespace, empty strings become null)
  const normalizeEmail = (email: string | null | undefined): string | null => {
    if (!email || !email.trim()) return null;
    return email.trim();
  };
  
  const normalizedEmail1 = normalizeEmail(data.email1);
  const normalizedEmail2 = normalizeEmail(data.email2);
  
  // Backward compatibility: if email1 is set, also set email; if phone1 is set, also set phone
  const finalEmail = normalizedEmail1 || data.email;
  const finalPhone = normalizedPhone1 || normalizedPhone;
  
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
  
  const updateData: any = {
    name: data.name,
    role: data.role,
    location: data.location,
    email: finalEmail,
    linkedIn: data.linkedIn,
    phone: finalPhone,
    contactMessage: normalizedContactMessage,
    cvUrl: data.cvUrl !== undefined ? (data.cvUrl || null) : existing?.cvUrl || null,
    avatarUrl: data.avatarUrl !== undefined ? (data.avatarUrl || null) : existing?.avatarUrl || null,
  };
  
  // Add extended fields if provided
  if (data.phone1 !== undefined) updateData.phone1 = normalizedPhone1;
  if (data.phone2 !== undefined) updateData.phone2 = normalizedPhone2;
  if (data.whatsapp !== undefined) updateData.whatsapp = normalizedWhatsApp;
  if (data.email1 !== undefined) updateData.email1 = normalizedEmail1;
  if (data.email2 !== undefined) updateData.email2 = normalizedEmail2;
  
  // Add visibility controls if provided
  if (data.showPhone1 !== undefined) updateData.showPhone1 = data.showPhone1;
  if (data.showPhone2 !== undefined) updateData.showPhone2 = data.showPhone2;
  if (data.showWhatsApp !== undefined) updateData.showWhatsApp = data.showWhatsApp;
  if (data.showEmail1 !== undefined) updateData.showEmail1 = data.showEmail1;
  if (data.showEmail2 !== undefined) updateData.showEmail2 = data.showEmail2;
  
  const result = await prisma.personInfo.upsert({
    where: { id: existing?.id || `person-${portfolioId}` },
    update: updateData,
    create: {
      id: `person-${portfolioId}`,
      portfolioId,
      ...updateData,
    },
  });
  
  revalidatePath("/admin/contact");
  // Public portfolio pages are under /portfolio/:slug now; revalidate admin only.
  return result;
}
