"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function uploadCV(formData: FormData) {
  await requireAuth();
  await assertNotImpersonatingForWrite();
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

export async function uploadAvatar(formData: FormData) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();

  const portfolioId = session.user.portfolioId;
  if (!portfolioId) {
    throw new Error("User must have a portfolio to upload an avatar");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Only PNG, JPEG, or WebP images are allowed");
  }

  // Max 3MB
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Avatar file size must be less than 3MB");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const publicPath = join(process.cwd(), "public");
  const uploadsDir = join(publicPath, "uploads", "avatars", portfolioId);

  // Ensure directory exists
  await (await import("fs/promises")).mkdir(uploadsDir, { recursive: true });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `avatar.${ext}`;
  const filepath = join(uploadsDir, filename);

  await writeFile(filepath, buffer);

  const avatarUrl = `/uploads/avatars/${portfolioId}/${filename}`;

  // Persist on PersonInfo (upsert by portfolioId)
  const existing = await prisma.personInfo.findUnique({ where: { portfolioId } });
  if (!existing) {
    // Require profile to exist first (keeps flow explicit and avoids creating empty profile)
    throw new Error("Create your profile first, then upload an avatar.");
  }

  await prisma.personInfo.update({
    where: { portfolioId },
    data: { avatarUrl },
  });

  // Get portfolio slug to revalidate the public portfolio page
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { slug: true },
  });

  // Revalidate all paths that display the avatar
  revalidatePath("/admin/contact");
  revalidatePath("/admin/account");
  revalidatePath("/admin");
  revalidatePath("/admin/layout", "layout"); // Revalidate layout
  // Revalidate public portfolio page if slug exists
  if (portfolio?.slug) {
    revalidatePath(`/portfolio/${portfolio.slug}`);
  }

  return { success: true, avatarUrl };
}
