/**
 * Prisma client for integration tests. Uses only DATABASE_URL (from dotenv in setup).
 * Use this instead of @/lib/prisma to avoid loading server-only env (AUTH_SECRET, etc.).
 */
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required for integration tests. Set it in .env or .env.test.");
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});
