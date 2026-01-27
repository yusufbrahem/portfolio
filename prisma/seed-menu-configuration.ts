import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

/**
 * Seed PlatformMenu with existing sections
 * This should be run after the migration
 */
async function seedMenuConfiguration() {
  const menus = [
    { key: "skills", label: "Skills", sectionType: "skills", enabled: true },
    { key: "projects", label: "Projects", sectionType: "projects", enabled: true },
    { key: "experience", label: "Experience", sectionType: "experience", enabled: true },
    { key: "about", label: "About", sectionType: "about", enabled: true },
    { key: "architecture", label: "Architecture", sectionType: "architecture", enabled: true },
    { key: "contact", label: "Contact", sectionType: "contact", enabled: true },
  ];

  console.log("Seeding PlatformMenu...");

  for (const menu of menus) {
    await prisma.platformMenu.upsert({
      where: { key: menu.key },
      update: {
        label: menu.label,
        sectionType: menu.sectionType,
        enabled: menu.enabled,
      },
      create: menu,
    });
    console.log(`✓ Created/updated menu: ${menu.key}`);
  }

  console.log("\nSeeding PortfolioMenu for existing portfolios...");

  // Get all portfolios
  const portfolios = await prisma.portfolio.findMany({
    select: { id: true },
  });

  // Get all platform menus
  const platformMenus = await prisma.platformMenu.findMany({
    select: { id: true, key: true },
  });

  // Create default PortfolioMenu entries for each portfolio
  let order = 0;
  for (const portfolio of portfolios) {
    order = 0;
    for (const platformMenu of platformMenus) {
      await prisma.portfolioMenu.upsert({
        where: {
          portfolioId_platformMenuId: {
            portfolioId: portfolio.id,
            platformMenuId: platformMenu.id,
          },
        },
        update: {
          // Keep existing order if it exists, otherwise use default
          order: order,
        },
        create: {
          portfolioId: portfolio.id,
          platformMenuId: platformMenu.id,
          visible: true, // Default to visible
          order: order,
        },
      });
      order++;
    }
    console.log(`✓ Created/updated menu config for portfolio: ${portfolio.id}`);
  }

  console.log("\n✓ Menu configuration seeding completed!");
}

seedMenuConfiguration()
  .catch((e) => {
    console.error("Error seeding menu configuration:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
