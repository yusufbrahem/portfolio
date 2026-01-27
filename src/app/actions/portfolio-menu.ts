"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hasSectionEditor } from "@/lib/section-types";

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

  // GUARD: Cannot enable menus without editors
  if (visible && !hasSectionEditor(portfolioMenu.platformMenu.sectionType)) {
    throw new Error("This section cannot be enabled until an editor exists");
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

  // SINGLE SOURCE OF TRUTH: Only allow reordering enabled platform menus with editors
  const invalidMenus = menus.filter(
    (m) => !m.platformMenu.enabled || !hasSectionEditor(m.platformMenu.sectionType)
  );
  if (invalidMenus.length > 0) {
    throw new Error("Cannot reorder menus that are disabled by the platform or have no editor");
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
 * Get enabled platform menus for a portfolio (for public rendering)
 * Only returns menus that have editors and are properly configured
 */
export async function getEnabledPortfolioMenus(portfolioId: string) {
  const menus = await prisma.portfolioMenu.findMany({
    where: {
      portfolioId,
      visible: true,
      platformMenu: {
        enabled: true,
      },
    },
    include: {
      platformMenu: true,
    },
    orderBy: { order: "asc" },
  });

  // Filter out menus without editors - they cannot be rendered
  return menus
    .filter((menu) => hasSectionEditor(menu.platformMenu.sectionType))
    .map((menu) => ({
      key: menu.platformMenu.key,
      label: menu.platformMenu.label,
      order: menu.order,
    }));
}
