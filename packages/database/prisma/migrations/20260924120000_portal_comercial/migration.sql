-- Portal comercial: lançamentos, condomínio, configuração e banners.

ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'CONDOMINIUM';

ALTER TABLE "properties" ADD COLUMN "is_launch" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "properties_tenant_id_is_launch_published_idx" ON "properties"("tenantId", "is_launch", "published");

CREATE TABLE "portal_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "hero_title" TEXT,
    "hero_subtitle" TEXT,
    "hero_image" TEXT,
    "logo_url" TEXT,
    "about_title" TEXT,
    "about_text" TEXT,
    "about_image" TEXT,
    "differentials" JSONB,
    "whatsapp" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "youtube" TEXT,
    "creci" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portal_configs_business_unit_id_key" ON "portal_configs"("business_unit_id");
CREATE UNIQUE INDEX "portal_configs_tenantId_business_unit_id_key" ON "portal_configs"("tenantId", "business_unit_id");

CREATE TABLE "portal_banners" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image" TEXT NOT NULL,
    "link" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portal_banners_tenantId_business_unit_id_active_order_idx" ON "portal_banners"("tenantId", "business_unit_id", "active", "order");

ALTER TABLE "portal_configs" ADD CONSTRAINT "portal_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_configs" ADD CONSTRAINT "portal_configs_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_banners" ADD CONSTRAINT "portal_banners_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_banners" ADD CONSTRAINT "portal_banners_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
