-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "showSkills" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showProjects" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showExperience" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showArchitecture" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showContact" BOOLEAN NOT NULL DEFAULT true;
