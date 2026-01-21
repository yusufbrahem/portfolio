/**
 * Seed script for creating initial admin user (development only)
 * 
 * Usage:
 *   NODE_ENV=development tsx prisma/seed-auth.ts
 * 
 * Or set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local
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

// Create PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function seedAdminUser() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    console.error("❌ This seed script is for development only!");
    console.error("   To create users in production, use a proper admin interface.");
    process.exit(1);
  }

  // Require ADMIN_EMAIL and ADMIN_PASSWORD to prevent insecure defaults
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL environment variable is required!");
    console.error("   Set it in your .env.local file.");
    process.exit(1);
  }
  
  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD environment variable is required!");
    console.error("   Set it in your .env.local file.");
    console.error("   ⚠️  Never use default passwords in production!");
    process.exit(1);
  }

  console.log("🌱 Seeding admin user...");
  console.log(`   Email: ${adminEmail}`);

  // Check if user already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log("⚠️  Admin user already exists. Updating password...");
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // Update existing user
    await prisma.adminUser.update({
      where: { email: adminEmail },
      data: { passwordHash },
    });
    
    console.log("✅ Admin user password updated!");
  } else {
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // Create new admin user
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Admin User",
      },
    });
    
    console.log("✅ Admin user created!");
  }

  console.log("\n📝 Login credentials:");
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log("\n⚠️  Remember to change the password after first login!");
}

seedAdminUser()
  .catch((e) => {
    console.error("❌ Error seeding admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
