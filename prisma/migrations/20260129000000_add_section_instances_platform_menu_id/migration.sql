-- Section instances: each platform menu has its own section data.
-- Step 1: Normalize sectionType to template values
UPDATE "PlatformMenu" SET "sectionType" = "sectionType" || '_template' WHERE "sectionType" NOT LIKE '%_template';

-- Ensure default platform menus exist (for fresh DBs where seed hasn't run yet)
INSERT INTO "PlatformMenu" (id, key, label, "sectionType", enabled, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'skills', 'Skills', 'skills_template', true, now(), now() FROM (SELECT 1) x WHERE NOT EXISTS (SELECT 1 FROM "PlatformMenu" WHERE "key" = 'skills');
INSERT INTO "PlatformMenu" (id, key, label, "sectionType", enabled, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'projects', 'Projects', 'projects_template', true, now(), now() FROM (SELECT 1) x WHERE NOT EXISTS (SELECT 1 FROM "PlatformMenu" WHERE "key" = 'projects');
INSERT INTO "PlatformMenu" (id, key, label, "sectionType", enabled, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'experience', 'Experience', 'experience_template', true, now(), now() FROM (SELECT 1) x WHERE NOT EXISTS (SELECT 1 FROM "PlatformMenu" WHERE "key" = 'experience');
INSERT INTO "PlatformMenu" (id, key, label, "sectionType", enabled, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'about', 'About', 'about_template', true, now(), now() FROM (SELECT 1) x WHERE NOT EXISTS (SELECT 1 FROM "PlatformMenu" WHERE "key" = 'about');
INSERT INTO "PlatformMenu" (id, key, label, "sectionType", enabled, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'architecture', 'Architecture', 'architecture_template', true, now(), now() FROM (SELECT 1) x WHERE NOT EXISTS (SELECT 1 FROM "PlatformMenu" WHERE "key" = 'architecture');
INSERT INTO "PlatformMenu" (id, key, label, "sectionType", enabled, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'contact', 'Contact', 'contact_template', true, now(), now() FROM (SELECT 1) x WHERE NOT EXISTS (SELECT 1 FROM "PlatformMenu" WHERE "key" = 'contact');

-- Step 2: Add nullable platformMenuId to all section content tables
ALTER TABLE "SkillGroup" ADD COLUMN "platformMenuId" TEXT;
ALTER TABLE "Experience" ADD COLUMN "platformMenuId" TEXT;
ALTER TABLE "Project" ADD COLUMN "platformMenuId" TEXT;
ALTER TABLE "AboutContent" ADD COLUMN "platformMenuId" TEXT;
ALTER TABLE "ArchitectureContent" ADD COLUMN "platformMenuId" TEXT;
ALTER TABLE "PersonInfo" ADD COLUMN "platformMenuId" TEXT;

-- Step 3: Backfill from default platform menus (by key)
UPDATE "SkillGroup" sg SET "platformMenuId" = (SELECT id FROM "PlatformMenu" pm WHERE pm."key" = 'skills' LIMIT 1) WHERE sg."platformMenuId" IS NULL;
UPDATE "Experience" e SET "platformMenuId" = (SELECT id FROM "PlatformMenu" pm WHERE pm."key" = 'experience' LIMIT 1) WHERE e."platformMenuId" IS NULL;
UPDATE "Project" p SET "platformMenuId" = (SELECT id FROM "PlatformMenu" pm WHERE pm."key" = 'projects' LIMIT 1) WHERE p."platformMenuId" IS NULL;
UPDATE "AboutContent" ac SET "platformMenuId" = (SELECT id FROM "PlatformMenu" pm WHERE pm."key" = 'about' LIMIT 1) WHERE ac."platformMenuId" IS NULL;
UPDATE "ArchitectureContent" arc SET "platformMenuId" = (SELECT id FROM "PlatformMenu" pm WHERE pm."key" = 'architecture' LIMIT 1) WHERE arc."platformMenuId" IS NULL;
UPDATE "PersonInfo" pi SET "platformMenuId" = (SELECT id FROM "PlatformMenu" pm WHERE pm."key" = 'contact' LIMIT 1) WHERE pi."platformMenuId" IS NULL;

-- Step 4: Make columns required and add FK (drop old unique where needed)
-- AboutContent: was unique on portfolioId; now unique on (portfolioId, platformMenuId)
ALTER TABLE "AboutContent" DROP CONSTRAINT IF EXISTS "AboutContent_portfolioId_key";
ALTER TABLE "AboutContent" ALTER COLUMN "platformMenuId" SET NOT NULL;
ALTER TABLE "AboutContent" ADD CONSTRAINT "AboutContent_portfolioId_platformMenuId_key" UNIQUE ("portfolioId", "platformMenuId");
ALTER TABLE "AboutContent" ADD CONSTRAINT "AboutContent_platformMenuId_fkey" FOREIGN KEY ("platformMenuId") REFERENCES "PlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ArchitectureContent
ALTER TABLE "ArchitectureContent" DROP CONSTRAINT IF EXISTS "ArchitectureContent_portfolioId_key";
ALTER TABLE "ArchitectureContent" ALTER COLUMN "platformMenuId" SET NOT NULL;
ALTER TABLE "ArchitectureContent" ADD CONSTRAINT "ArchitectureContent_portfolioId_platformMenuId_key" UNIQUE ("portfolioId", "platformMenuId");
ALTER TABLE "ArchitectureContent" ADD CONSTRAINT "ArchitectureContent_platformMenuId_fkey" FOREIGN KEY ("platformMenuId") REFERENCES "PlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PersonInfo
ALTER TABLE "PersonInfo" DROP CONSTRAINT IF EXISTS "PersonInfo_portfolioId_key";
ALTER TABLE "PersonInfo" ALTER COLUMN "platformMenuId" SET NOT NULL;
ALTER TABLE "PersonInfo" ADD CONSTRAINT "PersonInfo_portfolioId_platformMenuId_key" UNIQUE ("portfolioId", "platformMenuId");
ALTER TABLE "PersonInfo" ADD CONSTRAINT "PersonInfo_platformMenuId_fkey" FOREIGN KEY ("platformMenuId") REFERENCES "PlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Experience, SkillGroup, Project
ALTER TABLE "Experience" ALTER COLUMN "platformMenuId" SET NOT NULL;
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_platformMenuId_fkey" FOREIGN KEY ("platformMenuId") REFERENCES "PlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillGroup" ALTER COLUMN "platformMenuId" SET NOT NULL;
ALTER TABLE "SkillGroup" ADD CONSTRAINT "SkillGroup_platformMenuId_fkey" FOREIGN KEY ("platformMenuId") REFERENCES "PlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project" ALTER COLUMN "platformMenuId" SET NOT NULL;
ALTER TABLE "Project" ADD CONSTRAINT "Project_platformMenuId_fkey" FOREIGN KEY ("platformMenuId") REFERENCES "PlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Indexes for lookups by platformMenuId
CREATE INDEX "SkillGroup_platformMenuId_idx" ON "SkillGroup"("platformMenuId");
CREATE INDEX "SkillGroup_portfolioId_platformMenuId_idx" ON "SkillGroup"("portfolioId", "platformMenuId");
CREATE INDEX "SkillGroup_portfolioId_platformMenuId_order_idx" ON "SkillGroup"("portfolioId", "platformMenuId", "order");

CREATE INDEX "Experience_platformMenuId_idx" ON "Experience"("platformMenuId");
CREATE INDEX "Experience_portfolioId_platformMenuId_idx" ON "Experience"("portfolioId", "platformMenuId");
CREATE INDEX "Experience_portfolioId_platformMenuId_order_idx" ON "Experience"("portfolioId", "platformMenuId", "order");

CREATE INDEX "Project_platformMenuId_idx" ON "Project"("platformMenuId");
CREATE INDEX "Project_portfolioId_platformMenuId_idx" ON "Project"("portfolioId", "platformMenuId");
CREATE INDEX "Project_portfolioId_platformMenuId_order_idx" ON "Project"("portfolioId", "platformMenuId", "order");

CREATE INDEX "AboutContent_platformMenuId_idx" ON "AboutContent"("platformMenuId");
CREATE INDEX "ArchitectureContent_platformMenuId_idx" ON "ArchitectureContent"("platformMenuId");
CREATE INDEX "PersonInfo_platformMenuId_idx" ON "PersonInfo"("platformMenuId");
