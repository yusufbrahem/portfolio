"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

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

export async function createSkillGroup(data: { name: string; order: number }) {
  await requireAdmin();
  const result = await prisma.skillGroup.create({
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkillGroup(id: string, data: { name?: string; order?: number }) {
  await requireAdmin();
  const result = await prisma.skillGroup.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function deleteSkillGroup(id: string) {
  await requireAdmin();
  await prisma.skillGroup.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}

export async function createSkill(data: { skillGroupId: string; name: string; order: number }) {
  await requireAdmin();
  const result = await prisma.skill.create({
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkill(id: string, data: { name?: string; order?: number; skillGroupId?: string }) {
  await requireAdmin();
  const result = await prisma.skill.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function deleteSkill(id: string) {
  await requireAdmin();
  await prisma.skill.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}
