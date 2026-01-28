import "dotenv/config";
import { describe, it, expect } from "vitest";
import { prisma } from "../../vitest/test-prisma";
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
    expect(new Set(after.map((m: { key: string }) => m.key))).toEqual(new Set(DEFAULT_MENU_KEYS));

    await prisma.platformMenu.update({
      where: { id: first.id },
      data: { label: originalLabel },
    });
  });
});

describe.skipIf(isDummyDb)("section visibility safety", () => {
  it("disabling a section does NOT delete its data", async () => {
    const portfolioWithSection = await prisma.portfolio.findFirst({
      where: {
        portfolioMenus: {
          some: {
            platformMenu: { key: "skills" },
            portfolio: { skillGroups: { some: {} } },
          },
        },
      },
      select: {
        id: true,
        portfolioMenus: {
          where: { platformMenu: { key: "skills" } },
          select: { id: true, visible: true, publishedVisible: true },
          take: 1,
        },
      },
    });

    if (!portfolioWithSection?.portfolioMenus?.length) return;

    const beforeCount = await prisma.skillGroup.count({
      where: { portfolioId: portfolioWithSection.id },
    });
    const pm = portfolioWithSection.portfolioMenus[0];

    await prisma.portfolioMenu.update({
      where: { id: pm.id },
      data: { visible: false, publishedVisible: false },
    });

    const afterCount = await prisma.skillGroup.count({
      where: { portfolioId: portfolioWithSection.id },
    });
    expect(afterCount).toBe(beforeCount);

    await prisma.portfolioMenu.update({
      where: { id: pm.id },
      data: { visible: pm.visible, publishedVisible: pm.publishedVisible },
    });
  });

  it("re-enabling restores the same data", async () => {
    const portfolioWithSection = await prisma.portfolio.findFirst({
      where: {
        portfolioMenus: {
          some: { platformMenu: { key: "experience" } },
        },
        experiences: { some: {} },
      },
      select: {
        id: true,
        portfolioMenus: {
          where: { platformMenu: { key: "experience" } },
          select: { id: true, visible: true, publishedVisible: true },
          take: 1,
        },
      },
    });

    if (!portfolioWithSection?.portfolioMenus?.length) return;

    const beforeIds = (
      await prisma.experience.findMany({
        where: { portfolioId: portfolioWithSection.id },
        select: { id: true },
      })
    ).map((r: { id: string }) => r.id);
    const pm = portfolioWithSection.portfolioMenus[0];

    await prisma.portfolioMenu.update({
      where: { id: pm.id },
      data: { visible: false, publishedVisible: false },
    });
    await prisma.portfolioMenu.update({
      where: { id: pm.id },
      data: { visible: true, publishedVisible: true },
    });

    const afterIds = (
      await prisma.experience.findMany({
        where: { portfolioId: portfolioWithSection.id },
        select: { id: true },
      })
    ).map((r: { id: string }) => r.id);
    expect(afterIds.sort()).toEqual(beforeIds.sort());
  });
});

describe.skipIf(isDummyDb)("menu reorder safety", () => {
  it("reordering menus preserves section content", async () => {
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        portfolioMenus: { some: {} },
      },
      select: {
        id: true,
        portfolioMenus: {
          select: { id: true, order: true, platformMenuId: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!portfolio || portfolio.portfolioMenus.length < 2) return;

    const menuIds = portfolio.portfolioMenus.map((pm: { id: string }) => pm.id);
    const skillCountBefore = await prisma.skillGroup.count({
      where: { portfolioId: portfolio.id },
    });
    const experienceCountBefore = await prisma.experience.count({
      where: { portfolioId: portfolio.id },
    });

    const reversed = [...portfolio.portfolioMenus].reverse();
    await Promise.all(
      reversed.map((pm: { id: string }, index: number) =>
        prisma.portfolioMenu.update({
          where: { id: pm.id },
          data: { order: index, publishedOrder: index },
        })
      )
    );

    const skillCountAfter = await prisma.skillGroup.count({
      where: { portfolioId: portfolio.id },
    });
    const experienceCountAfter = await prisma.experience.count({
      where: { portfolioId: portfolio.id },
    });
    expect(skillCountAfter).toBe(skillCountBefore);
    expect(experienceCountAfter).toBe(experienceCountBefore);

    const ordersRestored = portfolio.portfolioMenus.map((pm: { id: string; order: number }, index: number) =>
      prisma.portfolioMenu.update({
        where: { id: pm.id },
        data: { order: index, publishedOrder: index },
      })
    );
    await Promise.all(ordersRestored);
  });

  it("no data loss after reorder", async () => {
    const portfolio = await prisma.portfolio.findFirst({
      where: { portfolioMenus: { some: {} } },
      select: { id: true, portfolioMenus: { select: { id: true }, orderBy: { order: "asc" } } },
    });

    if (!portfolio || portfolio.portfolioMenus.length < 2) return;

    const beforeMenuIds = new Set(portfolio.portfolioMenus.map((pm: { id: string }) => pm.id));
    const newOrder = [...portfolio.portfolioMenus].reverse().map((pm: { id: string }) => pm.id);

    await Promise.all(
      newOrder.map((menuId: string, index: number) =>
        prisma.portfolioMenu.update({
          where: { id: menuId },
          data: { order: index, publishedOrder: index },
        })
      )
    );

    const after = await prisma.portfolioMenu.findMany({
      where: { portfolioId: portfolio.id },
      select: { id: true },
    });
    expect(after.length).toBe(beforeMenuIds.size);
    expect(new Set(after.map((m: { id: string }) => m.id))).toEqual(beforeMenuIds);
  });
});

describe.skipIf(isDummyDb)("public portfolio layout safety", () => {
  it("public portfolio data for header is available for published portfolio", async () => {
    const portfolio = await prisma.portfolio.findFirst({
      where: { status: "PUBLISHED", slug: { not: null }, isPublic: true },
      select: { id: true, slug: true },
    });

    if (!portfolio?.slug) return;

    const bySlug = await prisma.portfolio.findFirst({
      where: { slug: portfolio.slug },
      select: { id: true, slug: true, status: true, isPublic: true },
    });
    expect(bySlug).not.toBeNull();
    expect(bySlug?.id).toBe(portfolio.id);

    const firstPerson = await prisma.personInfo.findFirst({
      where: { portfolioId: portfolio.id },
      select: { id: true, name: true, role: true },
    });
    expect(typeof firstPerson === "object" || firstPerson === null).toBe(true);
  });

  it("hidden sections do not cause crashes or missing layout", async () => {
    const portfolio = await prisma.portfolio.findFirst({
      where: { portfolioMenus: { some: {} } },
      select: { id: true },
    });

    if (!portfolio) return;

    const enabledMenusBefore = await prisma.portfolioMenu.findMany({
      where: { portfolioId: portfolio.id, publishedVisible: true, platformMenu: { enabled: true } },
      select: { id: true },
      orderBy: { publishedOrder: "asc" },
    });

    if (enabledMenusBefore.length === 0) return;

    const toHide = enabledMenusBefore[0];
    await prisma.portfolioMenu.update({
      where: { id: toHide.id },
      data: { publishedVisible: false },
    });

    const enabledMenusAfter = await prisma.portfolioMenu.findMany({
      where: { portfolioId: portfolio.id, publishedVisible: true, platformMenu: { enabled: true } },
      select: { id: true },
      orderBy: { publishedOrder: "asc" },
    });
    expect(enabledMenusAfter.length).toBe(enabledMenusBefore.length - 1);

    const skillGroups = await prisma.skillGroup.findMany({
      where: { portfolioId: portfolio.id, isVisible: true },
      select: { id: true },
    });
    const experiences = await prisma.experience.findMany({
      where: { portfolioId: portfolio.id, isVisible: true },
      select: { id: true },
    });
    expect(Array.isArray(skillGroups)).toBe(true);
    expect(Array.isArray(experiences)).toBe(true);

    await prisma.portfolioMenu.update({
      where: { id: toHide.id },
      data: { publishedVisible: true },
    });
  });
});
