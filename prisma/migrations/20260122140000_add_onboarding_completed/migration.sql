-- Add onboardingCompleted field to AdminUser
-- This tracks whether a user has completed the onboarding flow

ALTER TABLE "AdminUser" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
