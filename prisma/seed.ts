import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { site } from "../src/content/site";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Log database connection info without exposing credentials
const dbUrl = process.env.DATABASE_URL;
const urlObj = new URL(dbUrl);
console.log(`Connecting to database: ${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`);

// Create PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  console.log("Seeding database...");

  const portfolio = await prisma.portfolio.findFirst({ orderBy: { createdAt: "asc" } });
  if (!portfolio) {
    throw new Error("No portfolio found. Create a user and portfolio first (e.g. run app and sign up).");
  }

  const [contactMenu, skillsMenu, experienceMenu, projectsMenu, aboutMenu] = await Promise.all([
    prisma.platformMenu.findFirst({ where: { key: "contact", enabled: true } }),
    prisma.platformMenu.findFirst({ where: { key: "skills", enabled: true } }),
    prisma.platformMenu.findFirst({ where: { key: "experience", enabled: true } }),
    prisma.platformMenu.findFirst({ where: { key: "projects", enabled: true } }),
    prisma.platformMenu.findFirst({ where: { key: "about", enabled: true } }),
  ]);
  if (!contactMenu || !skillsMenu || !experienceMenu || !projectsMenu || !aboutMenu) {
    throw new Error("Default PlatformMenus not found. Run seed-menu-configuration first.");
  }

  // Seed PersonInfo - delete existing for this portfolio and create new
  await prisma.personInfo.deleteMany({ where: { portfolioId: portfolio.id } });
  await prisma.personInfo.create({
    data: {
      id: "person-1",
      portfolioId: portfolio.id,
      platformMenuId: contactMenu.id,
      name: site.person.name,
      role: site.person.role,
      location: site.person.location,
      email: site.person.email,
      linkedIn: site.person.linkedIn,
    },
  });

  // Seed HeroContent (by id for this seed; ensure portfolioId set)
  await prisma.heroContent.upsert({
    where: { id: "hero-1" },
    update: {},
    create: {
      id: "hero-1",
      portfolioId: portfolio.id,
      headline: site.hero.headline,
      subheadline: site.hero.subheadline,
      highlights: JSON.stringify(site.hero.highlights),
    },
  });

  // Seed Skills
  for (let i = 0; i < site.skills.length; i++) {
    const group = site.skills[i];
    const skillGroup = await prisma.skillGroup.upsert({
      where: { id: `group-${i}` },
      update: { name: group.group, order: i },
      create: {
        id: `group-${i}`,
        portfolioId: portfolio.id,
        platformMenuId: skillsMenu.id,
        name: group.group,
        order: i,
      },
    });

    for (let j = 0; j < group.items.length; j++) {
      await prisma.skill.upsert({
        where: { id: `skill-${i}-${j}` },
        update: { name: group.items[j], order: j },
        create: {
          id: `skill-${i}-${j}`,
          skillGroupId: skillGroup.id,
          name: group.items[j],
          order: j,
        },
      });
    }
  }

  // Seed Experience
  for (let i = 0; i < site.experience.roles.length; i++) {
    const role = site.experience.roles[i];
    const experience = await prisma.experience.upsert({
      where: { id: `exp-${i}` },
      update: {
        title: role.title,
        company: role.company,
        location: role.location,
        period: role.period,
        order: i,
      },
      create: {
        id: `exp-${i}`,
        portfolioId: portfolio.id,
        platformMenuId: experienceMenu.id,
        title: role.title,
        company: role.company,
        location: role.location,
        period: role.period,
        order: i,
      },
    });

    // Clear existing bullets and tech
    await prisma.experienceBullet.deleteMany({ where: { experienceId: experience.id } });
    await prisma.experienceTech.deleteMany({ where: { experienceId: experience.id } });

    // Add bullets
    for (let j = 0; j < role.bullets.length; j++) {
      await prisma.experienceBullet.create({
        data: {
          experienceId: experience.id,
          text: role.bullets[j],
          order: j,
        },
      });
    }

    // Add tech
    for (let j = 0; j < role.tech.length; j++) {
      await prisma.experienceTech.create({
        data: {
          experienceId: experience.id,
          name: role.tech[j],
          order: j,
        },
      });
    }
  }

  // Seed Projects
  for (let i = 0; i < site.projects.length; i++) {
    const project = site.projects[i];
    const dbProject = await prisma.project.upsert({
      where: { id: `proj-${i}` },
      update: {
        title: project.title,
        summary: project.summary,
        order: i,
      },
      create: {
        id: `proj-${i}`,
        portfolioId: portfolio.id,
        platformMenuId: projectsMenu.id,
        title: project.title,
        summary: project.summary,
        order: i,
      },
    });

    // Clear existing bullets and tags
    await prisma.projectBullet.deleteMany({ where: { projectId: dbProject.id } });
    await prisma.projectTag.deleteMany({ where: { projectId: dbProject.id } });

    // Add bullets
    for (let j = 0; j < project.bullets.length; j++) {
      await prisma.projectBullet.create({
        data: {
          projectId: dbProject.id,
          text: project.bullets[j],
          order: j,
        },
      });
    }

    // Add tags
    for (let j = 0; j < project.tags.length; j++) {
      await prisma.projectTag.create({
        data: {
          projectId: dbProject.id,
          name: project.tags[j],
          order: j,
        },
      });
    }
  }

  // Seed AboutContent
  const aboutContent = await prisma.aboutContent.upsert({
    where: { id: "about-1" },
    update: {
      title: site.about.title,
      paragraphs: JSON.stringify(site.about.paragraphs),
    },
    create: {
      id: "about-1",
      portfolioId: portfolio.id,
      platformMenuId: aboutMenu.id,
      title: site.about.title,
      paragraphs: JSON.stringify(site.about.paragraphs),
    },
  });

  // Clear existing principles
  await prisma.aboutPrinciple.deleteMany({ where: { aboutContentId: aboutContent.id } });

  // Add principles
  for (let i = 0; i < site.about.principles.length; i++) {
    const principle = site.about.principles[i];
    await prisma.aboutPrinciple.create({
      data: {
        aboutContentId: aboutContent.id,
        title: principle.title,
        description: principle.description,
        order: i,
      },
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
