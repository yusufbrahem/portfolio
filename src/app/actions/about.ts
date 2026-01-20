"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function getAboutContent() {
  const about = await prisma.aboutContent.findFirst({
    include: {
      principles: {
        orderBy: { order: "asc" },
      },
    },
  });
  return about;
}

export async function updateAboutContent(data: {
  title: string;
  paragraphs: string[];
}) {
  await requireAdmin();
  const existing = await prisma.aboutContent.findFirst();
  
  const result = await prisma.aboutContent.upsert({
    where: { id: existing?.id || "about-1" },
    update: {
      title: data.title,
      paragraphs: JSON.stringify(data.paragraphs),
    },
    create: {
      id: "about-1",
      title: data.title,
      paragraphs: JSON.stringify(data.paragraphs),
    },
  });
  
  revalidatePath("/admin/about");
  revalidatePath("/about");
  return result;
}

export async function createPrinciple(data: {
  aboutContentId: string;
  title: string;
  description: string;
  order: number;
}) {
  await requireAdmin();
  const result = await prisma.aboutPrinciple.create({
    data,
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
  return result;
}

export async function updatePrinciple(
  id: string,
  data: { title?: string; description?: string; order?: number }
) {
  await requireAdmin();
  const result = await prisma.aboutPrinciple.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
  return result;
}

export async function deletePrinciple(id: string) {
  await requireAdmin();
  await prisma.aboutPrinciple.delete({
    where: { id },
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
}
