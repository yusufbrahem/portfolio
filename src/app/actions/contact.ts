"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

// Public read - no auth required
export async function getPersonInfo() {
  const info = await prisma.personInfo.findFirst();
  return info;
}

// Admin read - requires authentication
export async function getPersonInfoForAdmin() {
  await requireAuth();
  return await getPersonInfo();
}

export async function updatePersonInfo(data: {
  name: string;
  role: string;
  location: string;
  email: string;
  linkedIn: string;
  cvUrl?: string | null;
}) {
  await requireAuth();
  const existing = await prisma.personInfo.findFirst();
  
  const result = await prisma.personInfo.upsert({
    where: { id: existing?.id || "person-1" },
    update: data,
    create: {
      id: "person-1",
      ...data,
    },
  });
  
  revalidatePath("/admin/contact");
  revalidatePath("/contact");
  revalidatePath("/resume");
  revalidatePath("/");
  return result;
}
