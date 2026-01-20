-- AlterTable
ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_username_key";

-- AlterTable
ALTER TABLE "AdminUser" 
  DROP COLUMN IF EXISTS "username",
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");
