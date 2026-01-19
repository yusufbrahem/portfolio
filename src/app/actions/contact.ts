"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPersonInfo() {
  const info = await prisma.personInfo.findFirst();
  return info;
}

export async function updatePersonInfo(data: {
  name: string;
  role: string;
  location: string;
  email: string;
  linkedIn: string;
}) {
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
  revalidatePath("/");
  return result;
}
