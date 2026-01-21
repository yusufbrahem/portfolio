"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, assertNotImpersonatingForWrite } from "@/lib/auth";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSlug(input: string) {
  const v = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-{2,}/g, "-");

  return v;
}

export async function updateMyAccount(data: { name?: string | null; email?: string | null }) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();

  const userId = session.user.id;

  const nextName = typeof data.name === "string" ? data.name.trim() : null;
  const nextEmailRaw = typeof data.email === "string" ? data.email : null;
  const nextEmail = nextEmailRaw ? normalizeEmail(nextEmailRaw) : null;

  if (nextEmail && !nextEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  // If email is changing, ensure uniqueness
  if (nextEmail && nextEmail !== session.user.email) {
    const existing = await prisma.adminUser.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });
    if (existing && existing.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: {
      ...(typeof nextName === "string" ? { name: nextName || null } : {}),
      ...(typeof nextEmail === "string" ? { email: nextEmail } : {}),
    },
    select: { id: true, email: true, name: true },
  });

  // Keep PersonInfo email in sync for this portfolio (if it exists)
  if (typeof nextEmail === "string" && session.user.portfolioId) {
    await prisma.personInfo.updateMany({
      where: { portfolioId: session.user.portfolioId },
      data: { email: nextEmail },
    });
  }

  revalidatePath("/admin/account");
  revalidatePath("/admin");

  return {
    user: updated,
    emailChanged: typeof nextEmail === "string" && nextEmail !== session.user.email,
  };
}

export async function getMyPortfolioSlug() {
  const session = await requireAuth();
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  return portfolio?.slug || "";
}

export async function updateMyPortfolioSlug(data: { slug: string }) {
  const session = await requireAuth();
  await assertNotImpersonatingForWrite();

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!portfolio) {
    throw new Error("No portfolio found for this account");
  }

  const nextSlug = normalizeSlug(data.slug);
  if (!nextSlug) {
    throw new Error("Slug cannot be empty");
  }
  if (nextSlug.length < 2) {
    throw new Error("Slug must be at least 2 characters");
  }

  const existing = await prisma.portfolio.findFirst({
    where: {
      slug: nextSlug,
      NOT: { id: portfolio.id },
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error("That URL is already taken");
  }

  await prisma.portfolio.update({
    where: { id: portfolio.id },
    data: { slug: nextSlug },
    select: { id: true },
  });

  revalidatePath("/admin/account");
  revalidatePath("/admin/users");

  return { slug: nextSlug };
}
