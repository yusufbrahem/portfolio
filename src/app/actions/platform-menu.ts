"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";
import { UI_COMPONENT_KEYS, isValidUIComponentKey } from "@/lib/ui-components";

const KEY_REGEX = /^[a-z0-9_-]+$/;

function validateComponentKeys(keys: unknown): keys is string[] {
  if (!Array.isArray(keys) || keys.length === 0) return false;
  return keys.every((k) => typeof k === "string" && isValidUIComponentKey(k));
}

function validateKey(key: string): { ok: boolean; error: string | null } {
  const k = key.trim();
  if (!k) return { ok: false, error: "Menu key is required" };
  if (k.length > TEXT_LIMITS.PLATFORM_MENU_KEY_MAX) {
    return { ok: false, error: `Key must be ${TEXT_LIMITS.PLATFORM_MENU_KEY_MAX} characters or less` };
  }
  if (/\s/.test(k)) return { ok: false, error: "Key cannot contain spaces" };
  if (k !== k.toLowerCase()) return { ok: false, error: "Key must be lowercase" };
  if (!KEY_REGEX.test(k)) return { ok: false, error: "Key must be lowercase letters, numbers, hyphens, or underscores only" };
  return { ok: true, error: null };
}

/**
 * Check if a platform menu key is available (unique).
 * Optionally exclude an existing menu id when editing.
 */
export async function checkPlatformMenuKeyAvailable(
  key: string,
  excludeMenuId?: string | null
): Promise<{ available: boolean; error: string | null }> {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    return { available: false, error: "Unauthorized" };
  }
  const v = validateKey(key);
  if (!v.ok) return { available: false, error: v.error };

  const existing = await prisma.platformMenu.findUnique({
    where: { key: key.trim().toLowerCase() },
    select: { id: true },
  });
  if (!existing) return { available: true, error: null };
  if (excludeMenuId && existing.id === excludeMenuId) return { available: true, error: null };
  return { available: false, error: `A menu with key "${key.trim()}" already exists` };
}

/**
 * Get all platform menus (super admin only), ordered by order then key.
 */
export async function getPlatformMenus() {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }
  return await prisma.platformMenu.findMany({
    orderBy: [{ order: "asc" }, { key: "asc" }],
  });
}

/**
 * Update platform menu (super admin only).
 * Key is immutable after creation.
 */
export async function updatePlatformMenu(
  menuId: string,
  data: {
    label?: string;
    enabled?: boolean;
    order?: number;
    componentKeys?: string[];
  }
) {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  const updateData: {
    label?: string;
    enabled?: boolean;
    order?: number;
    componentKeys?: unknown;
  } = {};
  if (data.label !== undefined) {
    const result = validateTextLength(
      data.label.trim(),
      TEXT_LIMITS.PLATFORM_MENU_LABEL,
      "Label"
    );
    if (!result.isValid) throw new Error(result.error ?? "Invalid label");
    updateData.label = data.label.trim();
  }
  if (data.enabled !== undefined) {
    updateData.enabled = data.enabled;
  }
  if (data.order !== undefined) {
    updateData.order = data.order;
  }
  if (data.componentKeys !== undefined) {
    if (!validateComponentKeys(data.componentKeys)) {
      throw new Error("At least one valid UI component is required");
    }
    updateData.componentKeys = data.componentKeys;
  }

  await prisma.platformMenu.update({
    where: { id: menuId },
    data: updateData,
  });

  // Sync MenuBlocks when componentKeys change: reorder and add/remove, preserve existing block data
  if (data.componentKeys !== undefined) {
    const portfolioMenus = await prisma.portfolioMenu.findMany({
      where: { platformMenuId: menuId },
      select: { id: true },
    });
    const offset = 10000; // Free slots 0..n-1 to avoid unique(portfolioMenuId, order) conflict
    for (const pm of portfolioMenus) {
      const existing = await prisma.menuBlock.findMany({
        where: { portfolioMenuId: pm.id },
        select: { id: true, componentKey: true, data: true },
      });
      for (let j = 0; j < existing.length; j++) {
        await prisma.menuBlock.update({
          where: { id: existing[j].id },
          data: { order: offset + j },
        });
      }
      const byKey = new Map(existing.map((b) => [b.componentKey, b]));
      for (let i = 0; i < data.componentKeys.length; i++) {
        const key = data.componentKeys[i];
        const block = byKey.get(key);
        if (block) {
          await prisma.menuBlock.update({
            where: { id: block.id },
            data: { order: i },
          });
          byKey.delete(key);
        } else {
          await prisma.menuBlock.create({
            data: { portfolioMenuId: pm.id, componentKey: key, order: i, data: {} },
          });
        }
      }
      for (const [, block] of byKey) {
        await prisma.menuBlock.delete({ where: { id: block.id } });
      }
    }
  }

  revalidatePath("/admin/platform-menus");
  revalidatePath("/admin/sections");
  revalidatePath("/admin/menus");
  revalidatePath("/admin");
}

/**
 * Create platform menu (super admin only).
 * Auto-creates PortfolioMenu entries and default MenuBlocks for all existing portfolios.
 */
export async function createPlatformMenu(data: {
  key: string;
  label: string;
  componentKeys: string[];
  order?: number;
  enabled?: boolean;
}) {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  const keyVal = validateKey(data.key);
  if (!keyVal.ok) throw new Error(keyVal.error ?? "Invalid key");

  const labelResult = validateTextLength(
    data.label.trim(),
    TEXT_LIMITS.PLATFORM_MENU_LABEL,
    "Label"
  );
  if (!labelResult.isValid) throw new Error(labelResult.error ?? "Invalid label");

  if (!validateComponentKeys(data.componentKeys)) {
    throw new Error("At least one valid UI component is required");
  }
  const componentKeys = data.componentKeys;

  const existing = await prisma.platformMenu.findUnique({
    where: { key: data.key.trim().toLowerCase() },
  });
  if (existing) {
    throw new Error(`A menu with key "${data.key.trim()}" already exists`);
  }

  const maxOrderResult = await prisma.platformMenu.aggregate({
    _max: { order: true },
  });
  const platformOrder = data.order ?? (maxOrderResult._max.order ?? -1) + 1;

  const platformMenu = await prisma.platformMenu.create({
    data: {
      key: data.key.trim().toLowerCase(),
      label: data.label.trim(),
      sectionType: null,
      componentKeys,
      order: platformOrder,
      enabled: data.enabled ?? true,
    },
    select: {
      id: true,
      key: true,
      label: true,
      sectionType: true,
      componentKeys: true,
      order: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const portfolios = await prisma.portfolio.findMany({
    select: { id: true },
  });
  const maxOrderByPortfolio = await prisma.portfolioMenu.groupBy({
    by: ["portfolioId"],
    _max: { order: true },
  });
  const nextOrderByPortfolio = new Map(
    maxOrderByPortfolio.map((r) => [r.portfolioId, (r._max.order ?? -1) + 1])
  );

  for (const portfolio of portfolios) {
    const nextPmOrder = nextOrderByPortfolio.get(portfolio.id) ?? 0;
    const pm = await prisma.portfolioMenu.create({
      data: {
        portfolioId: portfolio.id,
        platformMenuId: platformMenu.id,
        visible: false,
        publishedVisible: false,
        order: nextPmOrder,
        publishedOrder: nextPmOrder,
      },
    });
    for (let i = 0; i < componentKeys.length; i++) {
      await prisma.menuBlock.create({
        data: {
          portfolioMenuId: pm.id,
          componentKey: componentKeys[i],
          order: i,
          data: {},
        },
      });
    }
  }

  revalidatePath("/admin/platform-menus");
  revalidatePath("/admin/sections");
  revalidatePath("/admin/menus");
  revalidatePath("/admin");

  return platformMenu;
}

/**
 * Delete platform menu (super admin only).
 * Fails if any section data (skills, experience, etc.) references this menu.
 * Removes all PortfolioMenu entries for this menu, then deletes the PlatformMenu.
 */
export async function deletePlatformMenu(menuId: string) {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  const menu = await prisma.platformMenu.findUnique({
    where: { id: menuId },
    select: { id: true, key: true },
  });
  if (!menu) {
    throw new Error("Menu not found");
  }

  const [skillsCount, experienceCount, projectsCount, aboutCount, personCount, archCount] =
    await Promise.all([
      prisma.skillGroup.count({ where: { platformMenuId: menuId } }),
      prisma.experience.count({ where: { platformMenuId: menuId } }),
      prisma.project.count({ where: { platformMenuId: menuId } }),
      prisma.aboutContent.count({ where: { platformMenuId: menuId } }),
      prisma.personInfo.count({ where: { platformMenuId: menuId } }),
      prisma.architectureContent.count({ where: { platformMenuId: menuId } }),
    ]);

  const totalContent =
    skillsCount + experienceCount + projectsCount + aboutCount + personCount + archCount;
  if (totalContent > 0) {
    throw new Error(
      "Cannot delete: this menu has section content. Remove or reassign the content first."
    );
  }

  await prisma.$transaction([
    prisma.portfolioMenu.deleteMany({ where: { platformMenuId: menuId } }),
    prisma.platformMenu.delete({ where: { id: menuId } }),
  ]);

  revalidatePath("/admin/platform-menus");
  revalidatePath("/admin/sections");
  revalidatePath("/admin/menus");
  revalidatePath("/admin");
}
