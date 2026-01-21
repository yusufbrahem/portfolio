"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite } from "@/lib/auth";

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
