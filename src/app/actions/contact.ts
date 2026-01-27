"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getPersonInfo(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.personInfo.findFirst({
    where,
  });
}

// Admin read - requires authentication; scoped to portfolio + platform menu (section instance)
export async function getPersonInfoForAdmin(platformMenuId: string) {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;

  if (!portfolioId) return null;

  return await prisma.personInfo.findFirst({
    where: { portfolioId, platformMenuId },
  });
}

export async function updatePersonInfo(data: {
  platformMenuId?: string; // Optional: when omitted, first contact menu for portfolio is used (e.g. onboarding)
  name: string;
  role: string;
  location: string;
  email: string; // Legacy field, kept for backward compatibility
  linkedIn: string;
  phone?: string | null;
  contactMessage?: string | null;
  cvUrl?: string | null;
  avatarUrl?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  whatsapp?: string | null;
  email1?: string | null;
  email2?: string | null;
  showPhone1?: boolean;
  showPhone2?: boolean;
  showWhatsApp?: boolean;
  showEmail1?: boolean;
  showEmail2?: boolean;
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;

  if (!portfolioId) throw new Error("User must have a portfolio to update person info");

  let platformMenuId = data.platformMenuId;
  if (!platformMenuId) {
    const contactMenu = await prisma.portfolioMenu.findFirst({
      where: {
        portfolioId,
        platformMenu: { sectionType: "contact_template", enabled: true },
      },
      select: { platformMenuId: true },
    });
    if (!contactMenu) throw new Error("No contact section found for this portfolio");
    platformMenuId = contactMenu.platformMenuId;
  }
  const { platformMenuId: _pm, ...rest } = data;
  
  // Server-side length validation
  const nameValidation = validateTextLength(data.name, TEXT_LIMITS.NAME, "Name");
  if (!nameValidation.isValid) {
    throw new Error(nameValidation.error || "Name exceeds maximum length");
  }
  
  const roleValidation = validateTextLength(data.role, TEXT_LIMITS.TITLE, "Role");
  if (!roleValidation.isValid) {
    throw new Error(roleValidation.error || "Role exceeds maximum length");
  }
  
  const locationValidation = validateTextLength(data.location, TEXT_LIMITS.LABEL, "Location");
  if (!locationValidation.isValid) {
    throw new Error(locationValidation.error || "Location exceeds maximum length");
  }
  
  const linkedInValidation = validateTextLength(data.linkedIn, TEXT_LIMITS.URL, "LinkedIn URL");
  if (!linkedInValidation.isValid) {
    throw new Error(linkedInValidation.error || "LinkedIn URL exceeds maximum length");
  }
  
  if (data.contactMessage) {
    const contactMessageValidation = validateTextLength(data.contactMessage, TEXT_LIMITS.CONTACT_MESSAGE, "Contact message");
    if (!contactMessageValidation.isValid) {
      throw new Error(contactMessageValidation.error || "Contact message exceeds maximum length");
    }
  }
  
  if (data.email1) {
    const email1Validation = validateTextLength(data.email1, TEXT_LIMITS.URL, "Email");
    if (!email1Validation.isValid) {
      throw new Error(email1Validation.error || "Email exceeds maximum length");
    }
  }
  
  if (data.email2) {
    const email2Validation = validateTextLength(data.email2, TEXT_LIMITS.URL, "Email");
    if (!email2Validation.isValid) {
      throw new Error(email2Validation.error || "Email exceeds maximum length");
    }
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
    where: { portfolioId, platformMenuId },
  });

  const normalizedContactMessage = rest.contactMessage?.trim() || null;

  const updateData: Record<string, unknown> = {
    name: rest.name,
    role: rest.role,
    location: rest.location,
    email: finalEmail,
    linkedIn: rest.linkedIn,
    phone: finalPhone,
    contactMessage: normalizedContactMessage,
    cvUrl: rest.cvUrl !== undefined ? (rest.cvUrl || null) : existing?.cvUrl || null,
    avatarUrl: rest.avatarUrl !== undefined ? (rest.avatarUrl || null) : existing?.avatarUrl || null,
  };
  if (rest.phone1 !== undefined) updateData.phone1 = normalizedPhone1;
  if (rest.phone2 !== undefined) updateData.phone2 = normalizedPhone2;
  if (rest.whatsapp !== undefined) updateData.whatsapp = normalizedWhatsApp;
  if (rest.email1 !== undefined) updateData.email1 = normalizedEmail1;
  if (rest.email2 !== undefined) updateData.email2 = normalizedEmail2;
  if (rest.showPhone1 !== undefined) updateData.showPhone1 = rest.showPhone1;
  if (rest.showPhone2 !== undefined) updateData.showPhone2 = rest.showPhone2;
  if (rest.showWhatsApp !== undefined) updateData.showWhatsApp = rest.showWhatsApp;
  if (rest.showEmail1 !== undefined) updateData.showEmail1 = rest.showEmail1;
  if (rest.showEmail2 !== undefined) updateData.showEmail2 = rest.showEmail2;

  const result = await prisma.personInfo.upsert({
    where: { portfolioId_platformMenuId: { portfolioId, platformMenuId } },
    update: updateData,
    create: {
      portfolioId,
      platformMenuId,
      name: rest.name,
      role: rest.role,
      location: rest.location,
      email: finalEmail,
      linkedIn: rest.linkedIn,
      phone: finalPhone,
      contactMessage: normalizedContactMessage,
      cvUrl: (updateData.cvUrl as string | null) ?? null,
      avatarUrl: (updateData.avatarUrl as string | null) ?? null,
      phone1: (updateData.phone1 as string | null) ?? null,
      phone2: (updateData.phone2 as string | null) ?? null,
      whatsapp: (updateData.whatsapp as string | null) ?? null,
      email1: (updateData.email1 as string | null) ?? null,
      email2: (updateData.email2 as string | null) ?? null,
      showPhone1: (updateData.showPhone1 as boolean) ?? true,
      showPhone2: (updateData.showPhone2 as boolean) ?? true,
      showWhatsApp: (updateData.showWhatsApp as boolean) ?? true,
      showEmail1: (updateData.showEmail1 as boolean) ?? true,
      showEmail2: (updateData.showEmail2 as boolean) ?? true,
    },
  });

  revalidatePath("/admin/contact");
  revalidatePath("/admin/sections");
  return result;
}
