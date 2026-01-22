-- Add onboardingStep field to AdminUser
-- 0 = not started, 1-5 = current step, 6 = completed

ALTER TABLE "AdminUser" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0;
