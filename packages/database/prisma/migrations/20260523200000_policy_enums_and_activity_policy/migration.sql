-- Policy status enums + vínculo Activity.policyId

CREATE TYPE "PolicyStatus" AS ENUM ('pending', 'active', 'cancelled', 'expired', 'lapsed');
CREATE TYPE "PolicyRenewalStatus" AS ENUM ('pending', 'in_progress', 'renewed', 'lapsed', 'cancelled');

ALTER TABLE "policies" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "policies"
  ALTER COLUMN "status" TYPE "PolicyStatus" USING (
    CASE
      WHEN "status" IN ('pending', 'active', 'cancelled', 'expired', 'lapsed')
        THEN "status"::"PolicyStatus"
      ELSE 'pending'::"PolicyStatus"
    END
  );
ALTER TABLE "policies" ALTER COLUMN "status" SET DEFAULT 'pending'::"PolicyStatus";

ALTER TABLE "policies"
  ALTER COLUMN "renewalStatus" TYPE "PolicyRenewalStatus" USING (
    CASE
      WHEN "renewalStatus" IS NULL THEN NULL
      WHEN "renewalStatus" IN ('pending', 'in_progress', 'renewed', 'lapsed', 'cancelled')
        THEN "renewalStatus"::"PolicyRenewalStatus"
      ELSE 'pending'::"PolicyRenewalStatus"
    END
  );

ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "policyId" TEXT;

CREATE INDEX IF NOT EXISTS "activities_tenantId_policyId_idx" ON "activities"("tenantId", "policyId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_policyId_fkey'
  ) THEN
    ALTER TABLE "activities"
      ADD CONSTRAINT "activities_policyId_fkey"
      FOREIGN KEY ("policyId") REFERENCES "policies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
