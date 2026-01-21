-- SAFETY-FIRST ALIGNMENT MIGRATION
-- This migration aligns the existing DB to the current Prisma schema, without data loss:
-- - Creates "Portfolio"
-- - Adds "AdminUser.role"
-- - Adds portfolioId columns as NULLABLE, backfills existing rows to a default portfolio, then makes them NOT NULL

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AdminUser"
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user',
ALTER COLUMN "email" SET NOT NULL;

-- Add portfolioId columns (nullable first for backfill)
ALTER TABLE "SkillGroup" ADD COLUMN "portfolioId" TEXT;
ALTER TABLE "Experience" ADD COLUMN "portfolioId" TEXT;
ALTER TABLE "Project" ADD COLUMN "portfolioId" TEXT;
ALTER TABLE "AboutContent" ADD COLUMN "portfolioId" TEXT;
ALTER TABLE "PersonInfo" ADD COLUMN "portfolioId" TEXT;
ALTER TABLE "HeroContent" ADD COLUMN "portfolioId" TEXT;
ALTER TABLE "ArchitectureContent" ADD COLUMN "portfolioId" TEXT;

-- Create ONE default portfolio linked to the existing admin user
INSERT INTO "Portfolio" ("id", "userId", "slug", "isPublished", "createdAt", "updatedAt")
SELECT 'portfolio-1', "id", 'admin', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "AdminUser"
ORDER BY "createdAt" ASC
LIMIT 1
ON CONFLICT DO NOTHING;

-- Backfill existing data to default portfolio
UPDATE "SkillGroup" SET "portfolioId" = 'portfolio-1' WHERE "portfolioId" IS NULL;
UPDATE "Experience" SET "portfolioId" = 'portfolio-1' WHERE "portfolioId" IS NULL;
UPDATE "Project" SET "portfolioId" = 'portfolio-1' WHERE "portfolioId" IS NULL;
UPDATE "AboutContent" SET "portfolioId" = 'portfolio-1' WHERE "portfolioId" IS NULL;
UPDATE "PersonInfo" SET "portfolioId" = 'portfolio-1' WHERE "portfolioId" IS NULL;
UPDATE "HeroContent" SET "portfolioId" = 'portfolio-1' WHERE "portfolioId" IS NULL;
UPDATE "ArchitectureContent" SET "portfolioId" = 'portfolio-1' WHERE "portfolioId" IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE "SkillGroup" ALTER COLUMN "portfolioId" SET NOT NULL;
ALTER TABLE "Experience" ALTER COLUMN "portfolioId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "portfolioId" SET NOT NULL;
ALTER TABLE "AboutContent" ALTER COLUMN "portfolioId" SET NOT NULL;
ALTER TABLE "PersonInfo" ALTER COLUMN "portfolioId" SET NOT NULL;
ALTER TABLE "HeroContent" ALTER COLUMN "portfolioId" SET NOT NULL;
ALTER TABLE "ArchitectureContent" ALTER COLUMN "portfolioId" SET NOT NULL;

-- Indexes / uniques
CREATE UNIQUE INDEX "Portfolio_userId_key" ON "Portfolio"("userId");
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");
CREATE INDEX "Portfolio_slug_idx" ON "Portfolio"("slug");

CREATE INDEX "SkillGroup_portfolioId_idx" ON "SkillGroup"("portfolioId");
CREATE INDEX "SkillGroup_portfolioId_order_idx" ON "SkillGroup"("portfolioId", "order");

CREATE INDEX "Experience_portfolioId_idx" ON "Experience"("portfolioId");
CREATE INDEX "Experience_portfolioId_order_idx" ON "Experience"("portfolioId", "order");

CREATE INDEX "Project_portfolioId_idx" ON "Project"("portfolioId");
CREATE INDEX "Project_portfolioId_order_idx" ON "Project"("portfolioId", "order");

CREATE UNIQUE INDEX "AboutContent_portfolioId_key" ON "AboutContent"("portfolioId");
CREATE INDEX "AboutContent_portfolioId_idx" ON "AboutContent"("portfolioId");

CREATE UNIQUE INDEX "PersonInfo_portfolioId_key" ON "PersonInfo"("portfolioId");
CREATE INDEX "PersonInfo_portfolioId_idx" ON "PersonInfo"("portfolioId");

CREATE UNIQUE INDEX "HeroContent_portfolioId_key" ON "HeroContent"("portfolioId");
CREATE INDEX "HeroContent_portfolioId_idx" ON "HeroContent"("portfolioId");

CREATE UNIQUE INDEX "ArchitectureContent_portfolioId_key" ON "ArchitectureContent"("portfolioId");
CREATE INDEX "ArchitectureContent_portfolioId_idx" ON "ArchitectureContent"("portfolioId");

-- Foreign keys
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillGroup" ADD CONSTRAINT "SkillGroup_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AboutContent" ADD CONSTRAINT "AboutContent_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonInfo" ADD CONSTRAINT "PersonInfo_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HeroContent" ADD CONSTRAINT "HeroContent_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArchitectureContent" ADD CONSTRAINT "ArchitectureContent_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
