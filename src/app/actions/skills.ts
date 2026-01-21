"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

// Public read - no auth required
export async function getSkillGroups() {
  return await prisma.skillGroup.findMany({
    include: {
      skills: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
}

// Admin read - requires authentication
export async function getSkillGroupsForAdmin() {
  await requireAuth();
  return await getSkillGroups();
}

export async function createSkillGroup(data: { name: string; order: number }) {
  await requireAuth();
  const result = await prisma.skillGroup.create({
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkillGroup(id: string, data: { name?: string; order?: number }) {
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.skillGroup.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  const result = await prisma.skillGroup.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function deleteSkillGroup(id: string) {
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.skillGroup.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  await prisma.skillGroup.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}

export async function createSkill(data: { skillGroupId: string; name: string; order: number }) {
  await requireAuth();
  
  // Verify parent resource exists (ownership check would go here if schema supported it)
  const parent = await prisma.skillGroup.findUnique({ where: { id: data.skillGroupId } });
  if (!parent) {
    throw new Error("Parent resource not found");
  }
  
  const result = await prisma.skill.create({
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkill(id: string, data: { name?: string; order?: number; skillGroupId?: string }) {
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  const result = await prisma.skill.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function deleteSkill(id: string) {
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  await prisma.skill.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}
