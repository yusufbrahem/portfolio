-- AlterTable: Add sectionType to PlatformMenu
ALTER TABLE "PlatformMenu" ADD COLUMN "sectionType" TEXT NOT NULL DEFAULT 'custom_static';

-- CreateIndex
CREATE INDEX "PlatformMenu_sectionType_idx" ON "PlatformMenu"("sectionType");

-- Update existing menus with their section types
UPDATE "PlatformMenu" SET "sectionType" = 'skills' WHERE "key" = 'skills';
UPDATE "PlatformMenu" SET "sectionType" = 'projects' WHERE "key" = 'projects';
UPDATE "PlatformMenu" SET "sectionType" = 'experience' WHERE "key" = 'experience';
UPDATE "PlatformMenu" SET "sectionType" = 'about' WHERE "key" = 'about';
UPDATE "PlatformMenu" SET "sectionType" = 'architecture' WHERE "key" = 'architecture';
UPDATE "PlatformMenu" SET "sectionType" = 'contact' WHERE "key" = 'contact';

-- Make sectionType required (remove default after setting values)
ALTER TABLE "PlatformMenu" ALTER COLUMN "sectionType" DROP DEFAULT;
