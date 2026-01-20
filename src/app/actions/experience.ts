"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function getExperiences() {
  return await prisma.experience.findMany({
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

export async function createExperience(data: {
  title: string;
  company: string;
  location: string;
  period: string;
  order: number;
  bullets: string[];
  tech: string[];
}) {
  await requireAdmin();
  const { bullets, tech, ...experienceData } = data;
  const result = await prisma.experience.create({
    data: {
      ...experienceData,
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
  await requireAdmin();
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
  await requireAdmin();
  await prisma.experience.delete({
    where: { id },
  });
  revalidatePath("/admin/experience");
  revalidatePath("/experience");
  revalidatePath("/resume");
}
