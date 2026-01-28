/**
 * MIGRATION: Transfer Super Admin Portfolio to Normal User
 * 
 * This script:
 * 1. Finds the super admin user and their portfolio
 * 2. Creates a new normal user (role = "user")
 * 3. Transfers ownership of the portfolio to the new user
 * 4. Preserves all portfolio data (skills, projects, experience, about, hero, personInfo, architecture)
 * 
 * IMPORTANT: Run this ONCE before deploying the role hardening changes.
 * 
 * Usage:
 *   npx tsx prisma/migrate-super-admin-portfolio.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create Prisma client with PostgreSQL adapter (same as app)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  console.log("🔍 Finding super admin user...");
  
  // Find the super admin
  const superAdmin = await prisma.adminUser.findFirst({
    where: { role: "super_admin" },
    include: { portfolio: true },
  });

  if (!superAdmin) {
    console.log("❌ No super admin found. Nothing to migrate.");
    return;
  }

  if (!superAdmin.portfolio) {
    console.log("ℹ️  Super admin has no portfolio. Nothing to migrate.");
    return;
  }

  const portfolio = superAdmin.portfolio;
  console.log(`✅ Found super admin: ${superAdmin.email}`);
  console.log(`✅ Found portfolio: ${portfolio.id} (slug: ${portfolio.slug || "none"})`);

  // Check if a normal user already owns this portfolio (shouldn't happen, but safety check)
  const existingOwner = await prisma.adminUser.findUnique({
    where: { id: portfolio.userId },
  });

  if (existingOwner && existingOwner.role !== "super_admin") {
    console.log(`⚠️  Portfolio is already owned by a normal user: ${existingOwner.email}`);
    console.log("   Skipping migration.");
    return;
  }

  // Generate a new email for the normal user
  // Use the super admin's email with a suffix, or generate a new one
  const baseEmail = superAdmin.email.split("@")[0];
  const domain = superAdmin.email.split("@")[1] || "example.com";
  const newEmail = `${baseEmail}+portfolio@${domain}`;
  
  // Check if this email already exists
  const existingUser = await prisma.adminUser.findUnique({
    where: { email: newEmail },
  });

  if (existingUser) {
    console.log(`⚠️  User with email ${newEmail} already exists.`);
    console.log("   Please manually create a user and transfer the portfolio.");
    return;
  }

  // Generate a secure password
  const tempPassword = `portfolio_${Math.random().toString(36).slice(2, 12)}`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  console.log("\n📝 Creating new normal user...");
  console.log(`   Email: ${newEmail}`);
  console.log(`   Password: ${tempPassword}`);
  console.log("   ⚠️  SAVE THIS PASSWORD - you'll need it to log in!");

  // Create the new normal user
  const newUser = await prisma.adminUser.create({
    data: {
      email: newEmail,
      passwordHash,
      name: superAdmin.name || "Portfolio Owner",
      role: "user",
    },
  });

  console.log(`✅ Created user: ${newUser.id}`);

  // Transfer portfolio ownership
  console.log("\n🔄 Transferring portfolio ownership...");
  
  await prisma.portfolio.update({
    where: { id: portfolio.id },
    data: { userId: newUser.id },
  });

  console.log(`✅ Portfolio ${portfolio.id} now owned by ${newEmail}`);

  // Verify the transfer
  const verifyPortfolio = await prisma.portfolio.findUnique({
    where: { id: portfolio.id },
    include: {
      user: true,
      skillGroups: { include: { skills: true } },
      projects: true,
      experiences: true,
      aboutContents: { include: { principles: true } },
      heroContent: true,
      personInfos: true,
      architectureContents: { include: { pillars: { include: { points: true } } } },
    },
  });

  if (!verifyPortfolio) {
    throw new Error("Portfolio not found after transfer!");
  }

  console.log("\n📊 Portfolio Data Summary:");
  console.log(`   - Skill Groups: ${verifyPortfolio.skillGroups.length}`);
  console.log(`   - Skills: ${verifyPortfolio.skillGroups.reduce((sum, g) => sum + g.skills.length, 0)}`);
  console.log(`   - Projects: ${verifyPortfolio.projects.length}`);
  console.log(`   - Experience: ${verifyPortfolio.experiences.length}`);
  console.log(`   - About Content: ${verifyPortfolio.aboutContents.length > 0 ? "Yes" : "No"}`);
  console.log(`   - Hero Content: ${verifyPortfolio.heroContent ? "Yes" : "No"}`);
  console.log(`   - Person Info: ${verifyPortfolio.personInfos.length > 0 ? "Yes" : "No"}`);
  console.log(`   - Architecture Content: ${verifyPortfolio.architectureContents.length > 0 ? "Yes" : "No"}`);

  console.log("\n✅ Migration complete!");
  console.log("\n📋 IMPORTANT:");
  console.log(`   1. New user email: ${newEmail}`);
  console.log(`   2. Password: ${tempPassword}`);
  console.log(`   3. Portfolio slug: ${verifyPortfolio.slug || "none"}`);
  console.log(`   4. Public URL: ${verifyPortfolio.slug ? `/portfolio/${verifyPortfolio.slug}` : "N/A"}`);
  console.log("\n   The super admin account can no longer edit this portfolio.");
  console.log("   Log in with the new user account to manage the portfolio.");
  
  // Also write credentials to a file for easy reference
  const fs = await import("fs/promises");
  const credentialsFile = "MIGRATION_CREDENTIALS.txt";
  const credentialsContent = `Portfolio Migration Credentials
=====================================

Generated: ${new Date().toISOString()}

NEW USER CREDENTIALS:
--------------------
Email: ${newEmail}
Password: ${tempPassword}

PORTFOLIO INFO:
---------------
Portfolio ID: ${verifyPortfolio.id}
Portfolio Slug: ${verifyPortfolio.slug || "none"}
Public URL: ${verifyPortfolio.slug ? `/portfolio/${verifyPortfolio.slug}` : "N/A"}

PORTFOLIO DATA:
---------------
- Skill Groups: ${verifyPortfolio.skillGroups.length}
- Skills: ${verifyPortfolio.skillGroups.reduce((sum, g) => sum + g.skills.length, 0)}
- Projects: ${verifyPortfolio.projects.length}
- Experience: ${verifyPortfolio.experiences.length}
- About Content: ${verifyPortfolio.aboutContents.length > 0 ? "Yes" : "No"}
- Hero Content: ${verifyPortfolio.heroContent ? "Yes" : "No"}
- Person Info: ${verifyPortfolio.personInfos.length > 0 ? "Yes" : "No"}
- Architecture Content: ${verifyPortfolio.architectureContents.length > 0 ? "Yes" : "No"}

IMPORTANT:
----------
- The super admin account can no longer edit this portfolio
- Log in with the new user account to manage the portfolio
- This file contains sensitive credentials - keep it secure!
`;

  await fs.writeFile(credentialsFile, credentialsContent, "utf-8");
  console.log(`\n💾 Credentials also saved to: ${credentialsFile}`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
