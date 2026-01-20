"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function uploadCV(formData: FormData) {
  await requireAdmin();
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
