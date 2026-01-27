"use server";

import { prisma } from "@/lib/prisma";
import { CANONICAL_ADMIN_ROUTES } from "@/lib/section-types";

/**
 * Get menus to show in admin side menu.
 * Only menus that are BOTH enabled at platform level AND visible in this portfolio.
 * Default sections (skills, experience, projects, about, architecture, contact) link to
 * their canonical editors (/admin/skills, etc.) so existing section data is shown.
 * Other menus link to the block editor /admin/sections/[key].
 */
export async function getEnabledAdminMenus(portfolioId: string | null): Promise<
  Array<{ key: string; label: string; route: string }>
> {
  if (!portfolioId) return [];

  const portfolioMenus = await prisma.portfolioMenu.findMany({
    where: {
      portfolioId,
      visible: true,
      platformMenu: { enabled: true },
    },
    select: {
      platformMenu: {
        select: { key: true, label: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return portfolioMenus.map(({ platformMenu: menu }) => ({
    key: menu.key,
    label: menu.label,
    route: CANONICAL_ADMIN_ROUTES[menu.key] ?? `/admin/sections/${encodeURIComponent(menu.key)}`,
  }));
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
