-- AlterTable
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "opportunity_type" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "current_insurer" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "current_policy_number" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "policy_expires_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "leads_tenantId_policy_expires_at_idx" ON "leads"("tenantId", "policy_expires_at");
CREATE INDEX IF NOT EXISTS "activities_tenantId_completedAt_idx" ON "activities"("tenantId", "completedAt");
