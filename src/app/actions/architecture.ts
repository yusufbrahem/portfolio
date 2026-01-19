"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getArchitectureContent() {
  const architecture = await prisma.architectureContent.findFirst({
    include: {
      pillars: {
        include: {
          points: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
  return architecture;
}

export async function ensureArchitectureContent() {
  const existing = await prisma.architectureContent.findFirst();
  if (existing) return existing;
  
  return await prisma.architectureContent.create({
    data: {
      id: "arch-1",
    },
  });
}

export async function createPillar(data: {
  architectureContentId: string;
  title: string;
  order: number;
}) {
  const result = await prisma.architecturePillar.create({
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function updatePillar(
  id: string,
  data: { title?: string; order?: number }
) {
  const result = await prisma.architecturePillar.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function deletePillar(id: string) {
  await prisma.architecturePillar.delete({
    where: { id },
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
}

export async function createPoint(data: {
  architecturePillarId: string;
  text: string;
  order: number;
}) {
  const result = await prisma.architecturePoint.create({
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function updatePoint(
  id: string,
  data: { text?: string; order?: number }
) {
  const result = await prisma.architecturePoint.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function deletePoint(id: string) {
  await prisma.architecturePoint.delete({
    where: { id },
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
}
