"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";
import { isValidUIComponentKey } from "@/lib/ui-components";
import { DEFAULT_MENU_COMPONENT_KEYS } from "@/lib/default-menu-components";

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

/** Menu keys that cannot have their UI components edited by super admin (main section menus). */
const PROTECTED_MENU_KEYS = new Set(Object.keys(DEFAULT_MENU_COMPONENT_KEYS));

/**
 * Update platform menu (super admin only).
 * Key is immutable after creation.
 * Main menus (skills, experience, projects, about, architecture, contact) cannot have componentKeys changed.
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

  const existing = await prisma.platformMenu.findUnique({
    where: { id: menuId },
    select: { key: true },
  });
  if (!existing) {
    throw new Error("Menu not found");
  }
  const isProtected = PROTECTED_MENU_KEYS.has(existing.key);
  if (isProtected && data.componentKeys !== undefined) {
    throw new Error(`Cannot change UI components for the main menu "${existing.key}". This menu is protected.`);
  }

  const updateData: {
    label?: string;
    enabled?: boolean;
    order?: number;
    componentKeys?: Prisma.InputJsonValue;
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

  // Sync MenuBlocks when componentKeys change: MERGE only — add new components, reorder; NEVER delete blocks (non-destructive).
  // Blocks not in the new list are kept and assigned high order (hidden in UI; data preserved).
  const componentKeysToSync = data.componentKeys;
  if (componentKeysToSync !== undefined) {
    const portfolioMenus = await prisma.portfolioMenu.findMany({
      where: { platformMenuId: menuId },
      select: { id: true },
    });
    const offset = 10000;
    const hiddenOffset = 20000; // Distinct range so hidden blocks don't conflict with temp offset
    await prisma.$transaction(async (tx) => {
      for (const pm of portfolioMenus) {
        const existing = await tx.menuBlock.findMany({
          where: { portfolioMenuId: pm.id },
          select: { id: true, componentKey: true, data: true, order: true },
          orderBy: { order: "asc" },
        });
        for (let j = 0; j < existing.length; j++) {
          await tx.menuBlock.update({
            where: { id: existing[j].id },
            data: { order: offset + j },
          });
        }
        const byKey = new Map(existing.map((b) => [b.componentKey, b]));
        for (let i = 0; i < componentKeysToSync.length; i++) {
          const key = componentKeysToSync[i];
          const block = byKey.get(key);
          if (block) {
            await tx.menuBlock.update({
              where: { id: block.id },
              data: { order: i },
            });
            byKey.delete(key);
          } else {
            await tx.menuBlock.create({
              data: { portfolioMenuId: pm.id, componentKey: key, order: i, data: {} },
            });
          }
        }
        // Never delete: keep blocks not in the list; assign hidden range (data preserved, hidden in UI)
        let hiddenIndex = 0;
        for (const [, block] of byKey) {
          await tx.menuBlock.update({
            where: { id: block.id },
            data: { order: hiddenOffset + hiddenIndex },
          });
          hiddenIndex++;
        }
      }
    });
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

  const platformMenu = await prisma.$transaction(async (tx) => {
    const created = await tx.platformMenu.create({
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

    const portfolios = await tx.portfolio.findMany({
      select: { id: true },
    });
    const maxOrderByPortfolio = await tx.portfolioMenu.groupBy({
      by: ["portfolioId"],
      _max: { order: true },
    });
    const nextOrderByPortfolio = new Map(
      maxOrderByPortfolio.map((r) => [r.portfolioId, (r._max.order ?? -1) + 1])
    );

    for (const portfolio of portfolios) {
      const nextPmOrder = nextOrderByPortfolio.get(portfolio.id) ?? 0;
      const pm = await tx.portfolioMenu.create({
        data: {
          portfolioId: portfolio.id,
          platformMenuId: created.id,
          visible: false,
          publishedVisible: false,
          order: nextPmOrder,
          publishedOrder: nextPmOrder,
        },
      });
      for (let i = 0; i < componentKeys.length; i++) {
        await tx.menuBlock.create({
          data: {
            portfolioMenuId: pm.id,
            componentKey: componentKeys[i],
            order: i,
            data: {},
          },
        });
      }
    }
    return created;
  });

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
  if (PROTECTED_MENU_KEYS.has(menu.key)) {
    throw new Error(`Cannot delete the main menu "${menu.key}". This menu is protected.`);
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

/**
 * Restore default component keys for default menus (Skills, Experience, etc.).
 * Only adds missing default keys; never removes or hides existing components.
 * Also includes every component key that already exists in any MenuBlock so no block data is ever hidden.
 * Super admin only.
 */
export async function restoreDefaultMenuComponents(): Promise<{ updated: string[]; skipped: string[] }> {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  const defaultKeys = Object.keys(DEFAULT_MENU_COMPONENT_KEYS);
  const updated: string[] = [];
  const skipped: string[] = [];

  for (const menuKey of defaultKeys) {
    const platformMenu = await prisma.platformMenu.findUnique({
      where: { key: menuKey },
      select: { id: true, key: true, componentKeys: true },
    });
    if (!platformMenu) {
      skipped.push(menuKey);
      continue;
    }

    const current = Array.isArray(platformMenu.componentKeys)
      ? (platformMenu.componentKeys as string[]).filter((k) => typeof k === "string")
      : [];
    const defaults = DEFAULT_MENU_COMPONENT_KEYS[menuKey] ?? [];
    const missing = defaults.filter((k) => !current.includes(k));

    // Include every component key that already exists in any block for this menu (never hide blocks)
    const portfolioMenuIds = await prisma.portfolioMenu.findMany({
      where: { platformMenuId: platformMenu.id },
      select: { id: true },
    });
    const existingBlockKeys =
      portfolioMenuIds.length > 0
        ? await prisma.menuBlock.findMany({
            where: { portfolioMenuId: { in: portfolioMenuIds.map((pm) => pm.id) } },
            select: { componentKey: true },
            distinct: ["componentKey"],
          })
        : [];
    const keysFromBlocks = existingBlockKeys.map((b) => b.componentKey);

    // Build merged: missing defaults first, then current order, then any block keys not yet included (preserve all existing blocks)
    const merged = [...missing, ...current];
    for (const k of keysFromBlocks) {
      if (!merged.includes(k)) merged.push(k);
    }

    if (missing.length === 0 && merged.length === current.length) {
      skipped.push(menuKey);
      continue;
    }

    await updatePlatformMenu(platformMenu.id, { componentKeys: merged });
    updated.push(menuKey);
  }

  return { updated, skipped };
}

/** Minimum order value used for "hidden" blocks (same as in updatePlatformMenu sync). */
const HIDDEN_BLOCK_ORDER_MIN = 20000;

/**
 * Recover menu blocks that were hidden (order >= HIDDEN_BLOCK_ORDER_MIN).
 * Re-adds their component keys to each platform menu so blocks become visible again with data intact.
 * Use this first if data "disappeared" after a menu edit or restore — the blocks may only be hidden.
 * Super admin only.
 */
export async function recoverHiddenMenuBlocks(): Promise<{
  recovered: { menuKey: string; keysRestored: string[] }[];
  noneFound: boolean;
}> {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  const hiddenBlocks = await prisma.menuBlock.findMany({
    where: { order: { gte: HIDDEN_BLOCK_ORDER_MIN } },
    select: { portfolioMenuId: true, componentKey: true },
  });
  if (hiddenBlocks.length === 0) {
    return { recovered: [], noneFound: true };
  }

  const pmIds = [...new Set(hiddenBlocks.map((b) => b.portfolioMenuId))];
  const portfolioMenus = await prisma.portfolioMenu.findMany({
    where: { id: { in: pmIds } },
    select: { id: true, platformMenuId: true, platformMenu: { select: { key: true } } },
  });
  const pmToPlatform = new Map(portfolioMenus.map((pm) => [pm.id, pm]));

  const platformToHiddenKeys = new Map<string, Set<string>>();
  for (const b of hiddenBlocks) {
    const pm = pmToPlatform.get(b.portfolioMenuId);
    if (!pm) continue;
    let set = platformToHiddenKeys.get(pm.platformMenuId);
    if (!set) {
      set = new Set<string>();
      platformToHiddenKeys.set(pm.platformMenuId, set);
    }
    set.add(b.componentKey);
  }

  const recovered: { menuKey: string; keysRestored: string[] }[] = [];
  for (const [platformMenuId, hiddenKeys] of platformToHiddenKeys) {
    const pm = portfolioMenus.find((p) => p.platformMenuId === platformMenuId);
    const menuKey = pm?.platformMenu?.key ?? platformMenuId;
    const keysRestored = [...hiddenKeys];

    const platformMenu = await prisma.platformMenu.findUnique({
      where: { id: platformMenuId },
      select: { id: true, componentKeys: true },
    });
    if (!platformMenu) continue;

    const current = Array.isArray(platformMenu.componentKeys)
      ? (platformMenu.componentKeys as string[]).filter((k) => typeof k === "string")
      : [];
    const merged = [...current];
    for (const k of keysRestored) {
      if (!merged.includes(k)) merged.push(k);
    }
    if (merged.length === current.length) continue;

    await updatePlatformMenu(platformMenuId, { componentKeys: merged });
    recovered.push({ menuKey, keysRestored });
  }

  return { recovered, noneFound: false };
}
