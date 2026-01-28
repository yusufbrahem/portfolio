"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TEXT_LIMITS } from "@/lib/text-limits";

function parseComponentKeys(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((k): k is string => typeof k === "string");
}

/**
 * Load data for the generic menu editor: platform menu, portfolio menu, and blocks for this portfolio.
 */
export async function getMenuEditorData(portfolioId: string, menuKey: string) {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  const effectivePortfolioId = scope.portfolioId ?? session.user.portfolioId;
  if (!effectivePortfolioId || effectivePortfolioId !== portfolioId) {
    return null;
  }
  if (
    session.user.role !== "super_admin" &&
    session.user.portfolioId !== portfolioId
  ) {
    return null;
  }

  const platformMenu = await prisma.platformMenu.findUnique({
    where: { key: menuKey },
    select: { id: true, key: true, label: true, componentKeys: true, sectionType: true },
  });
  if (!platformMenu) return null;

  const portfolioMenu = await prisma.portfolioMenu.findFirst({
    where: { portfolioId, platformMenuId: platformMenu.id },
    select: { id: true },
  });
  if (!portfolioMenu) return null;

  const componentKeys = parseComponentKeys(platformMenu.componentKeys);
  const isComponentBased = componentKeys.length > 0;

  const blocks = isComponentBased
    ? await prisma.menuBlock.findMany({
        where: { portfolioMenuId: portfolioMenu.id },
        orderBy: { order: "asc" },
        select: { id: true, componentKey: true, order: true, data: true },
      })
    : [];

  return {
    platformMenu: {
      id: platformMenu.id,
      key: platformMenu.key,
      label: platformMenu.label,
      componentKeys,
      sectionType: platformMenu.sectionType,
    },
    portfolioMenuId: portfolioMenu.id,
    blocks: blocks.map((b: { id: string; componentKey: string; order: number; data: unknown }) => ({
      id: b.id,
      componentKey: b.componentKey,
      order: b.order,
      data: b.data as Record<string, unknown>,
    })),
    isComponentBased,
  };
}

function validateBlockData(
  componentKey: string,
  data: Record<string, unknown>
): void {
  const t = (v: unknown) => (typeof v === "string" ? v : "");
  switch (componentKey) {
    case "title":
      if (t(data.text).length > TEXT_LIMITS.MENU_BLOCK_TITLE) {
        throw new Error(`Title must be ${TEXT_LIMITS.MENU_BLOCK_TITLE} characters or less`);
      }
      break;
    case "subtitle":
      if (t(data.text).length > TEXT_LIMITS.MENU_BLOCK_SUBTITLE) {
        throw new Error(`Subtitle must be ${TEXT_LIMITS.MENU_BLOCK_SUBTITLE} characters or less`);
      }
      break;
    case "rich_text":
      if (t(data.content).length > TEXT_LIMITS.MENU_BLOCK_RICH_TEXT) {
        throw new Error(`Rich text must be ${TEXT_LIMITS.MENU_BLOCK_RICH_TEXT} characters or less`);
      }
      break;
    case "file_link": {
      const fileLinkItems = data.items;
      if (Array.isArray(fileLinkItems)) {
        for (const it of fileLinkItems) {
          if (it && typeof it === "object") {
            const o = it as { title?: unknown; externalUrl?: unknown };
            if (typeof o.title === "string" && o.title.length > TEXT_LIMITS.MENU_BLOCK_TITLE) {
              throw new Error(`Title must be ${TEXT_LIMITS.MENU_BLOCK_TITLE} characters or less`);
            }
            if (typeof o.externalUrl === "string" && o.externalUrl.length > TEXT_LIMITS.MENU_BLOCK_URL) {
              throw new Error(`URL must be ${TEXT_LIMITS.MENU_BLOCK_URL} characters or less`);
            }
          }
        }
      } else {
        if (t(data.title).length > TEXT_LIMITS.MENU_BLOCK_TITLE) {
          throw new Error(`Title must be ${TEXT_LIMITS.MENU_BLOCK_TITLE} characters or less`);
        }
        if (t(data.externalUrl).length > TEXT_LIMITS.MENU_BLOCK_URL) {
          throw new Error(`URL must be ${TEXT_LIMITS.MENU_BLOCK_URL} characters or less`);
        }
      }
      break;
    }
    case "pillar_card":
      if (t(data.title).length > TEXT_LIMITS.MENU_BLOCK_TITLE) {
        throw new Error(`Title must be ${TEXT_LIMITS.MENU_BLOCK_TITLE} characters or less`);
      }
      if (t(data.description).length > TEXT_LIMITS.MENU_BLOCK_DESCRIPTION) {
        throw new Error(`Description must be ${TEXT_LIMITS.MENU_BLOCK_DESCRIPTION} characters or less`);
      }
      break;
    case "contact_block": {
      if (t(data.message).length > TEXT_LIMITS.CONTACT_MESSAGE) {
        throw new Error(`Message must be ${TEXT_LIMITS.CONTACT_MESSAGE} characters or less`);
      }
      const emailVal = t(data.email).trim();
      if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        throw new Error("Enter a valid email address");
      }
      break;
    }
    default:
      break;
  }
  const items = data.items;
  if (Array.isArray(items)) {
    for (const it of items) {
      if (it && typeof it === "object" && "value" in it && typeof (it as { value: unknown }).value === "string") {
        if ((it as { value: string }).value.length > TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE) {
          throw new Error(`Each item must be ${TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE} characters or less`);
        }
      }
    }
  }
}

/**
 * Update a single menu block's data. Validates field lengths; no silent truncation.
 */
export async function updateMenuBlock(
  blockId: string,
  componentKey: string,
  data: Record<string, unknown>
) {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId ?? session.user.portfolioId;
  if (!portfolioId) throw new Error("Unauthorized");

  const block = await prisma.menuBlock.findUnique({
    where: { id: blockId },
    select: { id: true, componentKey: true, portfolioMenu: { select: { portfolioId: true } } },
  });
  if (!block || block.portfolioMenu.portfolioId !== portfolioId) {
    throw new Error("Block not found");
  }

  validateBlockData(block.componentKey, data);

  await prisma.menuBlock.update({
    where: { id: blockId },
    data: { data: data as object },
  });

  revalidatePath("/admin/sections");
  revalidatePath("/admin");
}
