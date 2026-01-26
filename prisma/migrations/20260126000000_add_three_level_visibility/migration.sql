-- Add three-level visibility system
-- Level 1: Portfolio-level visibility (master control)
-- Level 2: Section-level visibility (including About)
-- Level 3: Item-level visibility (SkillGroup, Project, Experience, ArchitecturePillar)

-- Portfolio-level visibility
ALTER TABLE "Portfolio" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- Section-level visibility (About section)
ALTER TABLE "Portfolio" ADD COLUMN "showAbout" BOOLEAN NOT NULL DEFAULT true;

-- Item-level visibility
ALTER TABLE "SkillGroup" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Experience" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ArchitecturePillar" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- Add indexes for visibility filtering
CREATE INDEX "SkillGroup_portfolioId_isVisible_idx" ON "SkillGroup"("portfolioId", "isVisible");
CREATE INDEX "Project_portfolioId_isVisible_idx" ON "Project"("portfolioId", "isVisible");
CREATE INDEX "Experience_portfolioId_isVisible_idx" ON "Experience"("portfolioId", "isVisible");
CREATE INDEX "ArchitecturePillar_architectureContentId_isVisible_idx" ON "ArchitecturePillar"("architectureContentId", "isVisible");
