-- Make sectionType nullable (legacy; prefer componentKeys)
ALTER TABLE "PlatformMenu" ALTER COLUMN "sectionType" DROP NOT NULL;

-- Add componentKeys and order to PlatformMenu
ALTER TABLE "PlatformMenu" ADD COLUMN "componentKeys" JSONB;
ALTER TABLE "PlatformMenu" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PlatformMenu_order_idx" ON "PlatformMenu"("order");

-- CreateTable
CREATE TABLE "MenuBlock" (
    "id" TEXT NOT NULL,
    "portfolioMenuId" TEXT NOT NULL,
    "componentKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuBlock_portfolioMenuId_order_key" ON "MenuBlock"("portfolioMenuId", "order");
CREATE INDEX "MenuBlock_portfolioMenuId_idx" ON "MenuBlock"("portfolioMenuId");
CREATE INDEX "MenuBlock_portfolioMenuId_order_idx" ON "MenuBlock"("portfolioMenuId", "order");

-- AddForeignKey
ALTER TABLE "MenuBlock" ADD CONSTRAINT "MenuBlock_portfolioMenuId_fkey" FOREIGN KEY ("portfolioMenuId") REFERENCES "PortfolioMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
