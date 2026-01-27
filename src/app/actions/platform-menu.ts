"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get all platform menus (super admin only)
 */
export async function getPlatformMenus() {
  const session = await requireAuth();
  
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  return await prisma.platformMenu.findMany({
    orderBy: { key: "asc" },
  });
}

/**
 * Update platform menu (super admin only)
 */
export async function updatePlatformMenu(
  menuId: string,
  data: { label?: string; enabled?: boolean }
) {
  const session = await requireAuth();
  
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  await prisma.platformMenu.update({
    where: { id: menuId },
    data,
  });

  revalidatePath("/admin/platform-menus");
  revalidatePath("/admin");
}

/**
 * Create platform menu (super admin only)
 * Auto-creates PortfolioMenu entries for all existing portfolios
 */
export async function createPlatformMenu(data: {
  key: string;
  label: string;
  sectionType: string;
  enabled?: boolean;
}) {
  const session = await requireAuth();
  
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  // Validate sectionType is provided
  if (!data.sectionType || !data.sectionType.trim()) {
    throw new Error("Section type is required");
  }

  // Check if key already exists
  const existing = await prisma.platformMenu.findUnique({
    where: { key: data.key },
  });

  if (existing) {
    throw new Error(`Menu with key "${data.key}" already exists`);
  }

  // Create the platform menu
  const platformMenu = await prisma.platformMenu.create({
    data: {
      key: data.key,
      label: data.label,
      sectionType: data.sectionType.trim(),
      enabled: data.enabled ?? true,
    },
    select: {
      id: true,
      key: true,
      label: true,
      sectionType: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Auto-create PortfolioMenu entries for all existing portfolios
  const portfolios = await prisma.portfolio.findMany({
    select: { id: true },
  });

  // Get the maximum order from existing portfolio menus to append new ones
  const maxOrderResult = await prisma.portfolioMenu.aggregate({
    _max: { order: true },
  });
  const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

  // Create PortfolioMenu entries for each portfolio
  await Promise.all(
    portfolios.map((portfolio) =>
      prisma.portfolioMenu.create({
        data: {
          portfolioId: portfolio.id,
          platformMenuId: platformMenu.id,
          visible: false, // New menus are hidden by default
          order: nextOrder,
        },
      })
    )
  );

  revalidatePath("/admin/platform-menus");
  revalidatePath("/admin");
  revalidatePath("/admin/menus");

  return platformMenu;
}
