-- Add PortfolioStatus enum and status field to Portfolio
-- This migration adds the portfolio lifecycle status system

-- CreateEnum
CREATE TYPE "PortfolioStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'REJECTED', 'PUBLISHED');

-- AlterTable: Add status and rejectionReason fields
ALTER TABLE "Portfolio" 
  ADD COLUMN "status" "PortfolioStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "Portfolio_status_idx" ON "Portfolio"("status");

-- Migrate existing data: Set status based on isPublished
-- If isPublished is true, set status to PUBLISHED
-- If isPublished is false, keep status as DRAFT (default)
UPDATE "Portfolio" SET "status" = 'PUBLISHED' WHERE "isPublished" = true;
