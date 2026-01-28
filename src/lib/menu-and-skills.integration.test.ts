import "dotenv/config";
import { describe, it, expect } from "vitest";
import { prisma } from "@/vitest/test-prisma";
import { DEFAULT_MENU_COMPONENT_KEYS } from "@/lib/default-menu-components";

const DEFAULT_MENU_KEYS = Object.keys(DEFAULT_MENU_COMPONENT_KEYS);

const isDummyDb =
  process.env.CI === "true" || process.env.DATABASE_URL?.includes("dummy");

describe.skipIf(isDummyDb)("menu edits and data integrity", () => {
  it("editing menu does NOT delete skills data", async () => {
    const portfolioWithSkills = await prisma.portfolio.findFirst({
      where: {
        skillGroups: { some: {} },
      },
      select: {
        id: true,
        portfolioMenus: { select: { id: true, visible: true }, take: 1 },
      },
    });

    if (!portfolioWithSkills || portfolioWithSkills.portfolioMenus.length === 0) {
      return; // No data to test; skip
    }

    const beforeSkills = await prisma.skill.count({
      where: { skillGroup: { portfolioId: portfolioWithSkills.id } },
    });
    const pm = portfolioWithSkills.portfolioMenus[0];

    await prisma.portfolioMenu.update({
      where: { id: pm.id },
      data: { visible: !pm.visible },
    });

    const afterSkills = await prisma.skill.count({
      where: { skillGroup: { portfolioId: portfolioWithSkills.id } },
    });
    expect(afterSkills).toBe(beforeSkills);

    await prisma.portfolioMenu.update({
      where: { id: pm.id },
      data: { visible: pm.visible },
    });
  });

  it("default menus remain intact after menu edits", async () => {
    const before = await prisma.platformMenu.findMany({
      where: { key: { in: DEFAULT_MENU_KEYS } },
      select: { id: true, key: true, label: true },
    });
    if (before.length === 0) return;

    const first = before[0];
    const originalLabel = first.label;
    const updatedLabel = originalLabel + " (test)";

    await prisma.platformMenu.update({
      where: { id: first.id },
      data: { label: updatedLabel },
    });

    const after = await prisma.platformMenu.findMany({
      where: { key: { in: DEFAULT_MENU_KEYS } },
      select: { key: true },
    });
    expect(after.length).toBe(before.length);
    expect(new Set(after.map((m) => m.key))).toEqual(new Set(DEFAULT_MENU_KEYS));

    await prisma.platformMenu.update({
      where: { id: first.id },
      data: { label: originalLabel },
    });
  });
});
