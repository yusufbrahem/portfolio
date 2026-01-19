"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";

export async function uploadCV(formData: FormData) {
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

  // Save to public folder
  const publicPath = join(process.cwd(), "public");
  const filename = "cv.pdf";
  const filepath = join(publicPath, filename);

  await writeFile(filepath, buffer);

  // Return the public URL path
  const cvUrl = `/${filename}`;

  revalidatePath("/admin/contact");
  revalidatePath("/resume");

  return { success: true, cvUrl };
}
