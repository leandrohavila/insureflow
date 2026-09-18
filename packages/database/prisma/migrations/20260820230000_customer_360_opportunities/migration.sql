-- CRM-005 Customer 360: responsável comercial + oportunidades unificadas

ALTER TABLE "customers" ADD COLUMN "owner_user_id" TEXT;

CREATE INDEX "customers_tenantId_owner_user_id_idx" ON "customers"("tenantId", "owner_user_id");

ALTER TABLE "customers"
  ADD CONSTRAINT "customers_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "OpportunityType" AS ENUM (
  'AUTO_INSURANCE',
  'LIFE_INSURANCE',
  'HEALTH_INSURANCE',
  'HOME_INSURANCE',
  'PROPERTY_BUY',
  'PROPERTY_SELL',
  'PROPERTY_RENT'
);

CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WON', 'LOST', 'DISMISSED');
CREATE TYPE "OpportunityScore" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "OpportunitySource" AS ENUM ('ENGINE', 'MANUAL', 'CROSS_SELL', 'PROPERTY', 'RENEWAL');

CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "business_unit_id" TEXT,
    "type" "OpportunityType" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "source" "OpportunitySource" NOT NULL DEFAULT 'ENGINE',
    "score" "OpportunityScore" NOT NULL DEFAULT 'MEDIUM',
    "origin_type" TEXT,
    "assigned_user_id" TEXT,
    "estimated_value" DECIMAL(14,2),
    "converted_deal_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "opportunities_customer_id_type_origin_type_key"
  ON "opportunities"("customer_id", "type", "origin_type");
CREATE INDEX "opportunities_tenantId_idx" ON "opportunities"("tenantId");
CREATE INDEX "opportunities_tenantId_status_idx" ON "opportunities"("tenantId", "status");
CREATE INDEX "opportunities_tenantId_customer_id_idx" ON "opportunities"("tenantId", "customer_id");
CREATE INDEX "opportunities_tenantId_business_unit_id_idx" ON "opportunities"("tenantId", "business_unit_id");
CREATE INDEX "opportunities_tenantId_assigned_user_id_idx" ON "opportunities"("tenantId", "assigned_user_id");

ALTER TABLE "opportunities"
  ADD CONSTRAINT "opportunities_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunities"
  ADD CONSTRAINT "opportunities_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunities"
  ADD CONSTRAINT "opportunities_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "opportunities"
  ADD CONSTRAINT "opportunities_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
