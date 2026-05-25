-- Reparo: garante coluna policyId em activities quando a migration anterior não foi aplicada por completo.

ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "policyId" TEXT;

CREATE INDEX IF NOT EXISTS "activities_tenantId_policyId_idx" ON "activities"("tenantId", "policyId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'policies'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_policyId_fkey'
  ) THEN
    ALTER TABLE "activities"
      ADD CONSTRAINT "activities_policyId_fkey"
      FOREIGN KEY ("policyId") REFERENCES "policies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
