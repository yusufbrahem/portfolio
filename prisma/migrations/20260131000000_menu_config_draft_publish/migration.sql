-- Menu configuration draft vs published: public only reflects published state
ALTER TABLE "PortfolioMenu" ADD COLUMN "publishedVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PortfolioMenu" ADD COLUMN "publishedOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill from current visible/order
UPDATE "PortfolioMenu" SET "publishedVisible" = "visible", "publishedOrder" = "order";

CREATE INDEX "PortfolioMenu_portfolioId_publishedVisible_idx" ON "PortfolioMenu"("portfolioId", "publishedVisible");
