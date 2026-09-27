-- Portal comercial: URL pública e slug público configuráveis pelo CRM.

ALTER TABLE "portal_configs" ADD COLUMN "portal_url" TEXT;
ALTER TABLE "portal_configs" ADD COLUMN "public_slug" TEXT;

CREATE UNIQUE INDEX "portal_configs_tenantId_public_slug_key" ON "portal_configs"("tenantId", "public_slug");
