"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";

const KEY_REGEX = /^[a-z0-9_-]+$/;

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
 * Update platform menu (super admin only).
 * Key is immutable after creation.
 */
export async function updatePlatformMenu(
  menuId: string,
  data: { label?: string; sectionType?: string; enabled?: boolean }
) {
  const session = await requireAuth();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  const updateData: { label?: string; sectionType?: string; enabled?: boolean } = {};
  if (data.label !== undefined) {
    const result = validateTextLength(
      data.label.trim(),
      TEXT_LIMITS.PLATFORM_MENU_LABEL,
      "Label"
    );
    if (!result.isValid) throw new Error(result.error ?? "Invalid label");
    updateData.label = data.label.trim();
  }
  if (data.sectionType !== undefined) {
    if (!data.sectionType.trim()) throw new Error("Section template is required");
    updateData.sectionType = data.sectionType.trim();
  }
  if (data.enabled !== undefined) {
    updateData.enabled = data.enabled;
  }

  await prisma.platformMenu.update({
    where: { id: menuId },
    data: updateData,
  });

  revalidatePath("/admin/platform-menus");
  revalidatePath("/admin");
}

/**
 * Create platform menu (super admin only).
 * Auto-creates PortfolioMenu entries for all existing portfolios.
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

  const keyVal = validateKey(data.key);
  if (!keyVal.ok) throw new Error(keyVal.error ?? "Invalid key");

  const labelResult = validateTextLength(
    data.label.trim(),
    TEXT_LIMITS.PLATFORM_MENU_LABEL,
    "Label"
  );
  if (!labelResult.isValid) throw new Error(labelResult.error ?? "Invalid label");

  if (!data.sectionType?.trim()) {
    throw new Error("Section template is required");
  }
  const sectionType = data.sectionType.trim();

  const existing = await prisma.platformMenu.findUnique({
    where: { key: data.key.trim().toLowerCase() },
  });
  if (existing) {
    throw new Error(`A menu with key "${data.key.trim()}" already exists`);
  }

  const platformMenu = await prisma.platformMenu.create({
    data: {
      key: data.key.trim().toLowerCase(),
      label: data.label.trim(),
      sectionType,
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

  const portfolios = await prisma.portfolio.findMany({
    select: { id: true },
  });
  const maxOrderResult = await prisma.portfolioMenu.aggregate({
    _max: { order: true },
  });
  const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

  await Promise.all(
    portfolios.map((portfolio) =>
      prisma.portfolioMenu.create({
        data: {
          portfolioId: portfolio.id,
          platformMenuId: platformMenu.id,
          visible: false,
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
