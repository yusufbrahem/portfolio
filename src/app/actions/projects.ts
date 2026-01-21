"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite } from "@/lib/auth";

// Public read - no auth required
// Can optionally filter by portfolioId (for future public portfolio pages)
export async function getProjects(portfolioId?: string | null) {
  const where = portfolioId ? { portfolioId } : {};
  
  return await prisma.project.findMany({
    where,
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tags: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

// Admin read - requires authentication
// Regular users see only their portfolio, super_admin sees all (or impersonated portfolio)
export async function getProjectsForAdmin() {
  const session = await requireAuth();
  const { getAdminReadScope } = await import("@/lib/auth");
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId || session.user.portfolioId;
  
  // If no portfolio ID (super admin not impersonating and no own portfolio), return empty
  if (!portfolioId) {
    return [];
  }
  
  return await prisma.project.findMany({
    where: { portfolioId },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tags: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

// Public read - no auth required
export async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tags: {
        orderBy: { order: "asc" },
      },
    },
  });
}

// Admin read - requires authentication
// Regular users can only access their portfolio's projects
export async function getProjectForAdmin(id: string) {
  const session = await requireAuth();
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tags: {
        orderBy: { order: "asc" },
      },
    },
  });
  
  if (!project) {
    throw new Error("Resource not found");
  }
  
  // Ownership check: super_admin can see any, users only their own
  if (session.user.role !== "super_admin") {
    if (!session.user.portfolioId || project.portfolioId !== session.user.portfolioId) {
      throw new Error("Access denied");
    }
  }
  
  return project;
}

export async function createProject(data: {
  title: string;
  summary: string;
  order: number;
  bullets: string[];
  tags: string[];
}) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  const portfolioId = session.user.portfolioId;
  
  if (!portfolioId) {
    throw new Error("User must have a portfolio to create projects");
  }
  
  const { bullets, tags, ...projectData } = data;
  const result = await prisma.project.create({
    data: {
      ...projectData,
      portfolioId,
      bullets: {
        create: bullets.map((text, index) => ({ text, order: index })),
      },
      tags: {
        create: tags.map((name, index) => ({ name, order: index })),
      },
    },
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tags: {
        orderBy: { order: "asc" },
      },
    },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  return result;
}

export async function updateProject(
  id: string,
  data: {
    title?: string;
    summary?: string;
    order?: number;
    bullets?: string[];
    tags?: string[];
  },
) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and user has access
  const existing = await prisma.project.findUnique({ 
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
  
  const { bullets, tags, ...projectData } = data;

  if (bullets !== undefined) {
    await prisma.projectBullet.deleteMany({ where: { projectId: id } });
  }
  if (tags !== undefined) {
    await prisma.projectTag.deleteMany({ where: { projectId: id } });
  }

  const result = await prisma.project.update({
    where: { id },
    data: {
      ...projectData,
      ...(bullets && {
        bullets: {
          create: bullets.map((text, index) => ({ text, order: index })),
        },
      }),
      ...(tags && {
        tags: {
          create: tags.map((name, index) => ({ name, order: index })),
        },
      }),
    },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  return result;
}

export async function deleteProject(id: string) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();
  
  // Verify resource exists and user has access
  const existing = await prisma.project.findUnique({ 
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
  
  await prisma.project.delete({
    where: { id },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}
