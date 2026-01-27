"use server";

import { prisma } from "@/lib/prisma";
import { hasSectionEditor, getSectionAdminRoute } from "@/lib/section-types";

/**
 * Get enabled platform menus for admin side menu
 * Returns menu key to route mapping
 * Only includes menus that have admin editors
 */
export async function getEnabledAdminMenus() {
  const enabledMenus = await prisma.platformMenu.findMany({
    where: { enabled: true },
    select: { key: true, label: true, sectionType: true },
    orderBy: { key: "asc" },
  });

  return enabledMenus
    .filter((menu) => hasSectionEditor(menu.sectionType))
    .map((menu) => {
      const route = getSectionAdminRoute(menu.sectionType);
      return {
        key: menu.key,
        label: menu.label,
        route: route!,
        hasEditor: true,
      };
    })
    .filter((menu) => menu.route !== null);
}

/**
 * Check if a menu is enabled by platform
 * Used for access control on admin pages
 */
export async function isMenuEnabled(menuKey: string): Promise<boolean> {
  const menu = await prisma.platformMenu.findUnique({
    where: { key: menuKey },
    select: { enabled: true },
  });

  return menu?.enabled ?? false;
}
