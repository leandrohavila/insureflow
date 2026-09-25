-- Sprint 20: ordem, SEO e vínculo do lead do portal com o CRM.
ALTER TABLE "properties" ADD COLUMN "portal_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN "meta_title" TEXT;
ALTER TABLE "properties" ADD COLUMN "meta_description" TEXT;

CREATE INDEX "properties_tenantId_published_portal_order_idx"
  ON "properties"("tenantId", "published", "portal_order");

ALTER TABLE "property_leads" ADD COLUMN "crm_lead_id" TEXT;
