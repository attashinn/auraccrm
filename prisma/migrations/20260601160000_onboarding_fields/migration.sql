-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "onboarding_data" JSONB;
