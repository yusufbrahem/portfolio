"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

// Public read - no auth required
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

// Admin read - requires authentication
export async function getArchitectureContentForAdmin() {
  await requireAuth();
  return await getArchitectureContent();
}

export async function ensureArchitectureContent() {
  await requireAuth();
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
  await requireAuth();
  
  // Verify parent resource exists (ownership check would go here if schema supported it)
  const parent = await prisma.architectureContent.findUnique({ where: { id: data.architectureContentId } });
  if (!parent) {
    throw new Error("Parent resource not found");
  }
  
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
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.architecturePillar.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  const result = await prisma.architecturePillar.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function deletePillar(id: string) {
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.architecturePillar.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
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
  await requireAuth();
  
  // Verify parent resource exists (ownership check would go here if schema supported it)
  const parent = await prisma.architecturePillar.findUnique({ where: { id: data.architecturePillarId } });
  if (!parent) {
    throw new Error("Parent resource not found");
  }
  
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
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.architecturePoint.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  const result = await prisma.architecturePoint.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
  return result;
}

export async function deletePoint(id: string) {
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.architecturePoint.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  await prisma.architecturePoint.delete({
    where: { id },
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
}
