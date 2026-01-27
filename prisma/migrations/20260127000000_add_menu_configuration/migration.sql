-- CreateTable
CREATE TABLE "PlatformMenu" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioMenu" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "platformMenuId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioMenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformMenu_key_key" ON "PlatformMenu"("key");

-- CreateIndex
CREATE INDEX "PlatformMenu_key_idx" ON "PlatformMenu"("key");

-- CreateIndex
CREATE INDEX "PlatformMenu_enabled_idx" ON "PlatformMenu"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioMenu_portfolioId_platformMenuId_key" ON "PortfolioMenu"("portfolioId", "platformMenuId");

-- CreateIndex
CREATE INDEX "PortfolioMenu_portfolioId_idx" ON "PortfolioMenu"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioMenu_portfolioId_order_idx" ON "PortfolioMenu"("portfolioId", "order");

-- CreateIndex
CREATE INDEX "PortfolioMenu_portfolioId_visible_idx" ON "PortfolioMenu"("portfolioId", "visible");

-- CreateIndex
CREATE INDEX "PortfolioMenu_platformMenuId_idx" ON "PortfolioMenu"("platformMenuId");

-- AddForeignKey
ALTER TABLE "PortfolioMenu" ADD CONSTRAINT "PortfolioMenu_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMenu" ADD CONSTRAINT "PortfolioMenu_platformMenuId_fkey" FOREIGN KEY ("platformMenuId") REFERENCES "PlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
