-- Sprint 5.3: Proposal Center — workflow viewed/expired, PDF metadata, e-sign prep

-- CreateEnum (Postgres adds new values; for fresh installs enum is recreated in schema)
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'viewed';
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "pdfStorageKey" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "pdfGeneratedAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "pdfVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "signatureProvider" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "signatureExternalId" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "signatureStatus" TEXT;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "publicViewToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "proposals_publicViewToken_key" ON "proposals"("publicViewToken");
CREATE INDEX IF NOT EXISTS "proposals_tenantId_createdAt_idx" ON "proposals"("tenantId", "createdAt");
