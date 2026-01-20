"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

export async function getProjects() {
  return await prisma.project.findMany({
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

export async function createProject(data: {
  title: string;
  summary: string;
  order: number;
  bullets: string[];
  tags: string[];
}) {
  await requireAuth();
  const { bullets, tags, ...projectData } = data;
  const result = await prisma.project.create({
    data: {
      ...projectData,
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
  await requireAuth();
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
  await requireAuth();
  await prisma.project.delete({
    where: { id },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}
