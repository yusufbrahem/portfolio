"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getExperiences(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.experience.findMany({
    where,
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tech: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

// Admin read - requires authentication
// Regular users see only their portfolio, super_admin sees all (or impersonated portfolio)
export async function getExperiencesForAdmin() {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;
  
  // If no portfolio ID (super admin not impersonating and no own portfolio), return empty
  if (!portfolioId) {
    return [];
  }
  
  return await prisma.experience.findMany({
    where: { portfolioId },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tech: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

// Public read - no auth required
export async function getExperience(id: string) {
  return await prisma.experience.findUnique({
    where: { id },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tech: {
        orderBy: { order: "asc" },
      },
    },
  });
}

// Admin read - requires authentication
// Regular users can only access their portfolio's experiences
export async function getExperienceForAdmin(id: string) {
  const session = await requireAuth();
  
  const experience = await prisma.experience.findUnique({
    where: { id },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tech: {
        orderBy: { order: "asc" },
      },
    },
  });
  
  if (!experience) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can see any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || experience.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  return experience;
}

export async function createExperience(data: {
  title: string;
  company: string;
  location: string;
  period: string;
  order: number;
  bullets: string[];
  tech: string[];
}) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to create experiences");
  }
  
  const { bullets, tech, ...experienceData } = data;
  const result = await prisma.experience.create({
    data: {
      ...experienceData,
      portfolioId,
      bullets: {
        create: bullets.map((text, index) => ({ text, order: index })),
      },
      tech: {
        create: tech.map((name, index) => ({ name, order: index })),
      },
    },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tech: {
        orderBy: { order: "asc" },
      },
    },
  });
  revalidatePath("/admin/experience");
  revalidatePath("/experience");
  revalidatePath("/resume");
  return result;
}

export async function updateExperience(
  id: string,
  data: {
    title?: string;
    company?: string;
    location?: string;
    period?: string;
    order?: number;
    bullets?: string[];
    tech?: string[];
  },
) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and user has access
  const existing = await prisma.experience.findUnique({ 
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
  if (data.title !== undefined) {
    const titleValidation = validateTextLength(data.title, TEXT_LIMITS.TITLE, "Experience title");
    if (!titleValidation.isValid) {
      throw new Error(titleValidation.error || "Experience title exceeds maximum length");
    }
  }
  
  if (data.company !== undefined) {
    const companyValidation = validateTextLength(data.company, TEXT_LIMITS.NAME, "Company");
    if (!companyValidation.isValid) {
      throw new Error(companyValidation.error || "Company exceeds maximum length");
    }
  }
  
  if (data.location !== undefined) {
    const locationValidation = validateTextLength(data.location, TEXT_LIMITS.LABEL, "Location");
    if (!locationValidation.isValid) {
      throw new Error(locationValidation.error || "Location exceeds maximum length");
    }
  }
  
  if (data.bullets !== undefined) {
    for (const bullet of data.bullets) {
      if (bullet.trim()) {
        const bulletValidation = validateTextLength(bullet, TEXT_LIMITS.BULLET, "Bullet point");
        if (!bulletValidation.isValid) {
          throw new Error(bulletValidation.error || "Bullet point exceeds maximum length");
        }
      }
    }
  }
  
  if (data.tech !== undefined) {
    for (const techItem of data.tech) {
      if (techItem.trim()) {
        const techValidation = validateTextLength(techItem, TEXT_LIMITS.TAG, "Technology");
        if (!techValidation.isValid) {
          throw new Error(techValidation.error || "Technology exceeds maximum length");
        }
      }
    }
  }
  
  const { bullets, tech, ...experienceData } = data;

  if (bullets !== undefined) {
    await prisma.experienceBullet.deleteMany({ where: { experienceId: id } });
  }
  if (tech !== undefined) {
    await prisma.experienceTech.deleteMany({ where: { experienceId: id } });
  }

  const result = await prisma.experience.update({
    where: { id },
    data: {
      ...experienceData,
      ...(bullets && {
        bullets: {
          create: bullets.map((text, index) => ({ text, order: index })),
        },
      }),
      ...(tech && {
        tech: {
          create: tech.map((name, index) => ({ name, order: index })),
        },
      }),
    },
  });
  revalidatePath("/admin/experience");
  revalidatePath("/experience");
  revalidatePath("/resume");
  return result;
}

export async function deleteExperience(id: string) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and user has access
  const existing = await prisma.experience.findUnique({ 
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
  
  await prisma.experience.delete({
    where: { id },
  });
  revalidatePath("/admin/experience");
  revalidatePath("/experience");
  revalidatePath("/resume");
}
