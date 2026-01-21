import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { site } from "../src/content/site";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

/**
 * Create default portfolio data for a user
 */
async function seedPortfolioData(portfolioId: string, userEmail: string, userName: string | null) {
  const displayName = userName || userEmail.split("@")[0];
  const emailPrefix = userEmail.split("@")[0];

  console.log(`  Creating portfolio data for ${displayName} (${userEmail})...`);

  // 1. PersonInfo
  await prisma.personInfo.upsert({
    where: { portfolioId },
    update: {},
    create: {
      portfolioId,
      name: displayName,
      role: "Software Engineer", // Default role, user can update
      location: "Location", // User should update
      email: userEmail,
      linkedIn: `https://www.linkedin.com/in/${emailPrefix}/`, // Placeholder
    },
  });

  // 2. HeroContent
  await prisma.heroContent.upsert({
    where: { portfolioId },
    update: {},
    create: {
      portfolioId,
      headline: `${displayName} — Software Engineer`,
      subheadline: `Portfolio for ${displayName}. Update this section with your professional summary.`,
      highlights: JSON.stringify([
        "Professional experience and expertise",
        "Key achievements and projects",
        "Technical skills and capabilities",
      ]),
    },
  });

  // 3. Skills (using template from site.ts)
  const skillGroups = await prisma.skillGroup.findMany({
    where: { portfolioId },
  });

  // Only create if no skills exist
  if (skillGroups.length === 0) {
    for (let i = 0; i < site.skills.length; i++) {
      const group = site.skills[i];
      const skillGroup = await prisma.skillGroup.create({
        data: {
          portfolioId,
          name: group.group,
          order: i,
        },
      });

      for (let j = 0; j < group.items.length; j++) {
        await prisma.skill.create({
          data: {
            skillGroupId: skillGroup.id,
            name: group.items[j],
            order: j,
          },
        });
      }
    }
  }

  // 4. Experience (using template from site.ts)
  const existingExperience = await prisma.experience.findMany({
    where: { portfolioId },
  });

  if (existingExperience.length === 0) {
    for (let i = 0; i < site.experience.roles.length; i++) {
      const role = site.experience.roles[i];
      const experience = await prisma.experience.create({
        data: {
          portfolioId,
          title: role.title,
          company: role.company,
          location: role.location,
          period: role.period,
          order: i,
        },
      });

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
  }

  // 5. Projects (using template from site.ts)
  const existingProjects = await prisma.project.findMany({
    where: { portfolioId },
  });

  if (existingProjects.length === 0) {
    for (let i = 0; i < site.projects.length; i++) {
      const project = site.projects[i];
      const dbProject = await prisma.project.create({
        data: {
          portfolioId,
          title: project.title,
          summary: project.summary,
          order: i,
        },
      });

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
  }

  // 6. AboutContent (using template from site.ts)
  const existingAbout = await prisma.aboutContent.findUnique({
    where: { portfolioId },
  });

  if (!existingAbout) {
    const aboutContent = await prisma.aboutContent.create({
      data: {
        portfolioId,
        title: site.about.title,
        paragraphs: JSON.stringify(site.about.paragraphs),
      },
    });

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
  }

  // 7. ArchitectureContent (using template from site.ts)
  const existingArchitecture = await prisma.architectureContent.findUnique({
    where: { portfolioId },
  });

  if (!existingArchitecture) {
    const architectureContent = await prisma.architectureContent.create({
      data: {
        portfolioId,
      },
    });

    // Add pillars
    for (let i = 0; i < site.architecture.pillars.length; i++) {
      const pillar = site.architecture.pillars[i];
      const dbPillar = await prisma.architecturePillar.create({
        data: {
          architectureContentId: architectureContent.id,
          title: pillar.title,
          order: i,
        },
      });

      // Add points
      for (let j = 0; j < pillar.points.length; j++) {
        await prisma.architecturePoint.create({
          data: {
            architecturePillarId: dbPillar.id,
            text: pillar.points[j],
            order: j,
          },
        });
      }
    }
  }

  console.log(`  ✓ Portfolio data created for ${displayName}`);
}

async function main() {
  console.log("🌱 Seeding portfolio data for all regular users...\n");

  // Find all users except super_admin
  const regularUsers = await prisma.adminUser.findMany({
    where: {
      role: { not: "super_admin" },
    },
    include: {
      portfolio: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (regularUsers.length === 0) {
    console.log("No regular users found. Skipping seed.");
    return;
  }

  console.log(`Found ${regularUsers.length} regular user(s):\n`);

  for (const user of regularUsers) {
    console.log(`Processing user: ${user.email} (${user.name || "no name"})`);

    // Ensure portfolio exists
    let portfolioId: string;
    if (user.portfolio) {
      portfolioId = user.portfolio.id;
      console.log(`  Portfolio exists: ${user.portfolio.slug || user.portfolio.id}`);
    } else {
      // Create portfolio if it doesn't exist
      const slug = user.email.split("@")[0] || `user-${user.id.slice(0, 8)}`;
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: user.id,
          slug,
          isPublished: false,
        },
      });
      portfolioId = portfolio.id;
      console.log(`  Created portfolio: ${slug}`);
    }

    // Seed portfolio data (only creates if missing)
    await seedPortfolioData(portfolioId, user.email, user.name);
    console.log("");
  }

  console.log("✅ Portfolio data seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding portfolio data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
