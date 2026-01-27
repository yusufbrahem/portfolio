/**
 * Restore section data to each user (portfolio).
 * Use when data (Skills, Projects, Experience, etc.) is still in the database
 * but not showing — re-links all section content to current platform menus
 * and ensures every portfolio has menu entries so sections appear.
 *
 * Run: npx tsx scripts/restore-section-data-to-users.ts
 * Requires: DATABASE_URL in .env.local or .env
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const MENU_KEYS = ["skills", "experience", "projects", "about", "architecture", "contact"] as const;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Use .env.local or .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

async function main() {
  console.log("Restoring section data to users...\n");

  // 1. Get current platform menu ids by key
  const menus = await prisma.platformMenu.findMany({
    where: { key: { in: [...MENU_KEYS] } },
    select: { id: true, key: true },
  });
  const menuById = new Map(menus.map((m) => [m.key, m.id]));
  console.log("Platform menus:", Array.from(menuById.keys()).join(", "));

  const skillsId = menuById.get("skills");
  const experienceId = menuById.get("experience");
  const projectsId = menuById.get("projects");
  const aboutId = menuById.get("about");
  const architectureId = menuById.get("architecture");
  const contactId = menuById.get("contact");

  // 2. Re-link all section content to current platform menus
  if (skillsId) {
    const r = await prisma.skillGroup.updateMany({ data: { platformMenuId: skillsId } });
    console.log(`SkillGroup: updated ${r.count} row(s) -> skills menu`);
  } else console.warn("Platform menu 'skills' not found, skipping SkillGroup");
  if (experienceId) {
    const r = await prisma.experience.updateMany({ data: { platformMenuId: experienceId } });
    console.log(`Experience: updated ${r.count} row(s) -> experience menu`);
  } else console.warn("Platform menu 'experience' not found, skipping Experience");
  if (projectsId) {
    const r = await prisma.project.updateMany({ data: { platformMenuId: projectsId } });
    console.log(`Project: updated ${r.count} row(s) -> projects menu`);
  } else console.warn("Platform menu 'projects' not found, skipping Project");
  if (aboutId) {
    const r = await prisma.aboutContent.updateMany({ data: { platformMenuId: aboutId } });
    console.log(`AboutContent: updated ${r.count} row(s) -> about menu`);
  } else console.warn("Platform menu 'about' not found, skipping AboutContent");
  if (architectureId) {
    const r = await prisma.architectureContent.updateMany({ data: { platformMenuId: architectureId } });
    console.log(`ArchitectureContent: updated ${r.count} row(s) -> architecture menu`);
  } else console.warn("Platform menu 'architecture' not found, skipping ArchitectureContent");
  if (contactId) {
    const r = await prisma.personInfo.updateMany({ data: { platformMenuId: contactId } });
    console.log(`PersonInfo: updated ${r.count} row(s) -> contact menu`);
  } else console.warn("Platform menu 'contact' not found, skipping PersonInfo");

  // 3. Ensure every portfolio has a PortfolioMenu for each platform menu (so section appears for that user)
  const portfolios = await prisma.portfolio.findMany({ select: { id: true } });
  const existing = await prisma.portfolioMenu.findMany({
    where: { platformMenuId: { in: menus.map((m) => m.id) } },
    select: { portfolioId: true, platformMenuId: true },
  });
  const existingSet = new Set(existing.map((e) => `${e.portfolioId}:${e.platformMenuId}`));

  let created = 0;
  const maxOrderByPortfolio = await prisma.portfolioMenu.groupBy({
    by: ["portfolioId"],
    _max: { order: true },
  });
  const nextOrder = new Map(maxOrderByPortfolio.map((r) => [r.portfolioId, (r._max.order ?? -1) + 1]));

  for (const portfolio of portfolios) {
    let baseOrder = nextOrder.get(portfolio.id) ?? 0;
    for (const menu of menus) {
      if (existingSet.has(`${portfolio.id}:${menu.id}`)) continue;
      await prisma.portfolioMenu.create({
        data: {
          portfolioId: portfolio.id,
          platformMenuId: menu.id,
          visible: true,
          publishedVisible: true,
          order: baseOrder,
          publishedOrder: baseOrder,
        },
      });
      existingSet.add(`${portfolio.id}:${menu.id}`);
      created++;
      baseOrder++;
    }
  }
  if (created > 0) console.log(`\nPortfolioMenu: created ${created} missing entries so sections appear for each user.`);

  console.log("\nDone. Section data is re-linked to current menus and each portfolio has menu entries.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
