-- Finalidade Temporada e código público estável para URLs amigáveis.
ALTER TYPE "PropertyPurpose" ADD VALUE IF NOT EXISTS 'SEASONAL';

ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "public_code" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "legacy_slugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX IF NOT EXISTS "properties_tenantId_public_code_key"
  ON "properties"("tenantId", "public_code");
