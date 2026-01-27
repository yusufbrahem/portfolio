#!/usr/bin/env node
/**
 * Backup PostgreSQL database. Uses DATABASE_URL from .env.local or .env.
 * Requires: pg_dump on PATH (or run scripts/backup-database.ps1 on Windows with Docker).
 * Usage: node scripts/backup-database.mjs   or   npm run db:backup
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const backupDir = join(__dirname, "backups");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = join(projectRoot, name);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*["]?([^"\s]+)["]?\s*$/);
      if (m) process.env.DATABASE_URL = m[1].trim();
    }
    if (process.env.DATABASE_URL) break;
  }
}
loadEnv();

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("postgresql")) {
  console.error("DATABASE_URL not set or invalid in .env.local / .env");
  process.exit(1);
}

if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
const backupFile = join(backupDir, `portfolio-${timestamp}.sql`);

const result = spawnSync("pg_dump", [url, "--no-owner", "--no-acl", "-f", backupFile], {
  stdio: "inherit",
  shell: true,
});
if (result.status !== 0) {
  console.error("pg_dump failed. Install PostgreSQL client tools or run scripts/backup-database.ps1");
  process.exit(1);
}
console.log("Backup saved:", backupFile);
