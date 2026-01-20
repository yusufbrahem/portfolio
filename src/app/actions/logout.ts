"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

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
  await prisma.aboutPrinciple.delete({
    where: { id },
  });
  revalidatePath("/admin/about");
  revalidatePath("/about");
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

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
  await prisma.architecturePoint.delete({
    where: { id },
  });
  revalidatePath("/admin/architecture");
  revalidatePath("/architecture");
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

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

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

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
  await requireAuth();
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
  await requireAuth();
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
  await requireAuth();
  await prisma.experience.delete({
    where: { id },
  });
  revalidatePath("/admin/experience");
  revalidatePath("/experience");
  revalidatePath("/resume");
}

"use server";

import { signOut } from "@/auth";

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}

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

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

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
  await prisma.skillGroup.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}

export async function createSkill(data: { skillGroupId: string; name: string; order: number }) {
  await requireAuth();
  const result = await prisma.skill.create({
    data,
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return result;
}

export async function updateSkill(id: string, data: { name?: string; order?: number; skillGroupId?: string }) {
  await requireAuth();
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
  await prisma.skill.delete({
    where: { id },
  });
  revalidatePath("/admin/skills");
  revalidatePath("/skills");
}

"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

export async function uploadCV(formData: FormData) {
  await requireAuth();
  const file = formData.get("file") as File;
  
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed");
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size must be less than 10MB");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to public folder with original filename
  const publicPath = join(process.cwd(), "public");
  // Sanitize filename to prevent path traversal and keep original name
  const originalFilename = file.name;
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = sanitizedFilename || "cv.pdf";
  const filepath = join(publicPath, filename);

  await writeFile(filepath, buffer);

  // Return the public URL path and original filename
  const cvUrl = `/${filename}`;

  revalidatePath("/admin/contact");
  revalidatePath("/resume");

  return { success: true, cvUrl, filename: originalFilename };
}

