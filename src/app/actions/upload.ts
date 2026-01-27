"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite, assertNotSuperAdminForPortfolioWrite } from "@/lib/auth";
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
  await assertNotSuperAdminForPortfolioWrite(); // Block super_admin from portfolio writes
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

  // Persist on first PersonInfo for this portfolio (portfolio has many personInfos)
  const existing = await prisma.personInfo.findFirst({
    where: { portfolioId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Create your profile first, then upload an avatar.");
  }

  await prisma.personInfo.update({
    where: { id: existing.id },
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

const MENU_FILE_ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MENU_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Upload a file for a menu block (e.g. File/Link component).
 * Saves to public/uploads/menu-files/{portfolioId}/{blockId}_{itemId?}_{sanitized}.
 * Optional itemId allows multiple files per block (e.g. multiple certificates).
 */
export async function uploadMenuFile(
  formData: FormData,
  portfolioId: string,
  blockId: string,
  itemId?: string
) {
  const session = await requireAuth();
  await assertNotSuperAdminForPortfolioWrite();
  await assertNotImpersonatingForWrite();

  if (session.user.portfolioId !== portfolioId) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  if (!MENU_FILE_ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only PDF, PNG, JPEG, or WebP are allowed");
  }
  if (file.size > MENU_FILE_MAX_BYTES) {
    throw new Error("File must be less than 10MB");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fs = await import("fs/promises");
  const publicPath = join(process.cwd(), "public");
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const dir = join(publicPath, "uploads", "menu-files", portfolioId);
  await fs.mkdir(dir, { recursive: true });
  const idPart = itemId ? `${itemId.slice(0, 8)}_` : "";
  const filename = `${blockId.slice(0, 8)}_${idPart}${sanitized.slice(0, 40)}.${ext}`;
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);
  const url = `/uploads/menu-files/${portfolioId}/${filename}`;

  revalidatePath("/admin/sections");
  revalidatePath("/admin");
  return { success: true, url };
}
