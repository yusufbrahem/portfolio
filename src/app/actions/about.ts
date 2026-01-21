"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

// Public read - no auth required
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

// Admin read - requires authentication
export async function getAboutContentForAdmin() {
  await requireAuth();
  return await getAboutContent();
}

export async function updateAboutContent(data: {
  title: string;
  paragraphs: string[];
}) {
  await requireAuth();
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
  await requireAuth();
  
  // Verify parent resource exists (ownership check would go here if schema supported it)
  const parent = await prisma.aboutContent.findUnique({ where: { id: data.aboutContentId } });
  if (!parent) {
    throw new Error("Parent resource not found");
  }
  
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
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.aboutPrinciple.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  const result = await prisma.aboutPrinciple.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
  return result;
}

export async function deletePrinciple(id: string) {
  await requireAuth();
  
  // Verify resource exists (ownership check would go here if schema supported it)
  const existing = await prisma.aboutPrinciple.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Resource not found");
  }
  
  await prisma.aboutPrinciple.delete({
    where: { id },
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
}
