"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get portfolio menus for a specific portfolio
 */
export async function getPortfolioMenus(portfolioId: string) {
  const session = await requireAuth();
  
  // Check if user owns this portfolio or is super admin
  if (session.user.role !== "super_admin" && session.user.portfolioId !== portfolioId) {
    throw new Error("Unauthorized: You can only access your own portfolio menus");
  }

  const menus = await prisma.portfolioMenu.findMany({
    where: { portfolioId },
    include: {
      platformMenu: true,
    },
    orderBy: { order: "asc" },
  });

  // Return ALL menus (including disabled ones) so UI can show proper state
  // UI will handle disabling interactions for platform-disabled menus
  return menus;
}

/**
 * Update portfolio menu visibility
 */
export async function updatePortfolioMenuVisibility(
  portfolioMenuId: string,
  visible: boolean
) {
  const session = await requireAuth();
  
  // Get the portfolio menu to check ownership and platform state
  const portfolioMenu = await prisma.portfolioMenu.findUnique({
    where: { id: portfolioMenuId },
    include: { 
      portfolio: true,
      platformMenu: true,
    },
  });

  if (!portfolioMenu) {
    throw new Error("Portfolio menu not found");
  }

  // SINGLE SOURCE OF TRUTH: If platform menu is disabled, user cannot enable it
  if (visible && !portfolioMenu.platformMenu.enabled) {
    throw new Error("This section is disabled by the platform and cannot be shown publicly");
  }

  // Check authorization
  if (
    session.user.role !== "super_admin" &&
    session.user.portfolioId !== portfolioMenu.portfolioId
  ) {
    throw new Error("Unauthorized: You can only update your own portfolio menus");
  }

  await prisma.portfolioMenu.update({
    where: { id: portfolioMenuId },
    data: { visible },
  });

  revalidatePath("/admin/menus");
  revalidatePath("/admin");
}

/**
 * Reorder portfolio menus
 */
export async function reorderPortfolioMenus(
  portfolioId: string,
  menuIds: string[]
) {
  const session = await requireAuth();
  
  // Check authorization
  if (session.user.role !== "super_admin" && session.user.portfolioId !== portfolioId) {
    throw new Error("Unauthorized: You can only reorder your own portfolio menus");
  }

  // Validate all menus belong to this portfolio and are enabled
  const menus = await prisma.portfolioMenu.findMany({
    where: { 
      id: { in: menuIds },
      portfolioId,
    },
    include: {
      platformMenu: true,
    },
  });

  // Only allow reordering menus that are enabled by the platform
  const invalidMenus = menus.filter((m: { platformMenu: { enabled: boolean } }) => !m.platformMenu.enabled);
  if (invalidMenus.length > 0) {
    throw new Error("Cannot reorder menus that are disabled by the platform");
  }

  // Ensure all requested menu IDs exist and belong to this portfolio
  if (menus.length !== menuIds.length) {
    throw new Error("Some menus not found or do not belong to this portfolio");
  }

  // Update order for each menu
  await Promise.all(
    menuIds.map((menuId, index) =>
      prisma.portfolioMenu.update({
        where: { id: menuId },
        data: { order: index },
      })
    )
  );

  revalidatePath("/admin/menus");
  revalidatePath("/admin");
}

/**
 * Get enabled platform menus for PUBLIC portfolio rendering.
 * Uses publishedVisible and publishedOrder only (draft changes not visible until published).
 */
export async function getEnabledPortfolioMenus(portfolioId: string) {
  const menus = await prisma.portfolioMenu.findMany({
    where: {
      portfolioId,
      publishedVisible: true,
      platformMenu: { enabled: true },
    },
    include: { platformMenu: true },
    orderBy: { publishedOrder: "asc" },
  });

  return menus.map((menu: { id: string; publishedOrder: number; platformMenu: { key: string; label: string; id: string; sectionType: string | null; componentKeys: unknown } }) => ({
    id: menu.id,
    key: menu.platformMenu.key,
    label: menu.platformMenu.label,
    order: menu.publishedOrder,
    platformMenuId: menu.platformMenu.id,
    sectionType: menu.platformMenu.sectionType,
    componentKeys: menu.platformMenu.componentKeys,
  }));
}

/**
 * Publish menu configuration: copy draft visible/order to published.
 * Public portfolio updates only after this is called.
 */
export async function publishMenuConfiguration(portfolioId: string) {
  const session = await requireAuth();
  if (session.user.role !== "super_admin" && session.user.portfolioId !== portfolioId) {
    throw new Error("Unauthorized");
  }

  // Fetch in current draft order so publishedOrder becomes 0, 1, 2, ...
  const menus = await prisma.portfolioMenu.findMany({
    where: { portfolioId },
    select: { id: true, visible: true, order: true },
    orderBy: { order: "asc" },
  });

  await Promise.all(
    menus.map((pm: { id: string; visible: boolean }, index: number) =>
      prisma.portfolioMenu.update({
        where: { id: pm.id },
        data: { publishedVisible: pm.visible, publishedOrder: index },
      })
    )
  );

  revalidatePath("/admin/menus");
  revalidatePath("/admin");

  // Revalidate public portfolio so new order is visible
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { slug: true },
  });
  if (portfolio?.slug) {
    revalidatePath(`/portfolio/${portfolio.slug}`, "page");
  }
}

/**
 * Ensure a portfolio has a PortfolioMenu for every enabled PlatformMenu.
 * Called when creating a new portfolio so contact and other sections exist (e.g. onboarding).
 * Idempotent: only creates missing entries.
 */
export async function ensurePortfolioHasDefaultMenus(portfolioId: string): Promise<void> {
  const platformMenus = await prisma.platformMenu.findMany({
    where: { enabled: true },
    select: { id: true },
    orderBy: { order: "asc" },
  });
  const existing = await prisma.portfolioMenu.findMany({
    where: { portfolioId },
    select: { platformMenuId: true },
  });
  const existingIds = new Set(existing.map((e: { platformMenuId: string }) => e.platformMenuId));
  let order = 0;
  for (const pm of platformMenus) {
    if (existingIds.has(pm.id)) continue;
    await prisma.portfolioMenu.create({
      data: {
        portfolioId,
        platformMenuId: pm.id,
        visible: true,
        publishedVisible: true,
        order,
        publishedOrder: order,
      },
    });
    order++;
  }
}
