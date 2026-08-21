-- Multiempresa (BusinessUnit) + interesses + reativação de leads + templates + cross-sell

CREATE TYPE "BusinessUnitType" AS ENUM ('INSURANCE', 'REAL_ESTATE');
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'EMAIL');
CREATE TYPE "ReactivationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'BOTH');
CREATE TYPE "CrossSellStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONVERTED', 'DISMISSED');
CREATE TYPE "ReactivationDispatchStatus" AS ENUM ('sent', 'failed');

CREATE TABLE "business_units" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "BusinessUnitType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_units_tenantId_slug_key" ON "business_units"("tenantId", "slug");
CREATE INDEX "business_units_tenantId_idx" ON "business_units"("tenantId");
CREATE INDEX "business_units_tenantId_type_idx" ON "business_units"("tenantId", "type");

ALTER TABLE "business_units"
  ADD CONSTRAINT "business_units_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lead_business_units" (
    "leadId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "is_origin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_business_units_pkey" PRIMARY KEY ("leadId", "businessUnitId")
);

CREATE INDEX "lead_business_units_businessUnitId_idx" ON "lead_business_units"("businessUnitId");

ALTER TABLE "lead_business_units"
  ADD CONSTRAINT "lead_business_units_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_business_units"
  ADD CONSTRAINT "lead_business_units_businessUnitId_fkey"
  FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "customer_business_units" (
    "customerId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "is_origin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_business_units_pkey" PRIMARY KEY ("customerId", "businessUnitId")
);

CREATE INDEX "customer_business_units_businessUnitId_idx" ON "customer_business_units"("businessUnitId");

ALTER TABLE "customer_business_units"
  ADD CONSTRAINT "customer_business_units_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_business_units"
  ADD CONSTRAINT "customer_business_units_businessUnitId_fkey"
  FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lead_reactivation_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "idle_days" INTEGER NOT NULL DEFAULT 30,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "channel" "ReactivationChannel" NOT NULL DEFAULT 'WHATSAPP',
    "template_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_reactivation_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lead_reactivation_settings_tenantId_key" ON "lead_reactivation_settings"("tenantId");

ALTER TABLE "lead_reactivation_settings"
  ADD CONSTRAINT "lead_reactivation_settings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT,
    "name" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "kind" TEXT NOT NULL DEFAULT 'reactivation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "message_templates_tenantId_idx" ON "message_templates"("tenantId");
CREATE INDEX "message_templates_tenantId_channel_idx" ON "message_templates"("tenantId", "channel");
CREATE INDEX "message_templates_tenantId_active_idx" ON "message_templates"("tenantId", "active");
CREATE INDEX "message_templates_tenantId_kind_idx" ON "message_templates"("tenantId", "kind");

ALTER TABLE "message_templates"
  ADD CONSTRAINT "message_templates_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_templates"
  ADD CONSTRAINT "message_templates_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "cross_sell_opportunities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "origin_category" TEXT NOT NULL,
    "suggested_category" TEXT NOT NULL,
    "status" "CrossSellStatus" NOT NULL DEFAULT 'PENDING',
    "converted_deal_id" TEXT,
    "converted_revenue" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_sell_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cross_sell_opportunities_unique_pair"
  ON "cross_sell_opportunities"("customerId", "origin_category", "suggested_category");
CREATE INDEX "cross_sell_opportunities_tenantId_idx" ON "cross_sell_opportunities"("tenantId");
CREATE INDEX "cross_sell_opportunities_tenantId_status_idx" ON "cross_sell_opportunities"("tenantId", "status");
CREATE INDEX "cross_sell_opportunities_tenantId_customerId_idx" ON "cross_sell_opportunities"("tenantId", "customerId");

ALTER TABLE "cross_sell_opportunities"
  ADD CONSTRAINT "cross_sell_opportunities_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cross_sell_opportunities"
  ADD CONSTRAINT "cross_sell_opportunities_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lead_reactivation_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "templateId" TEXT,
    "content" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "ReactivationDispatchStatus" NOT NULL DEFAULT 'sent',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_reactivation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_reactivation_logs_tenantId_sent_at_idx" ON "lead_reactivation_logs"("tenantId", "sent_at");
CREATE INDEX "lead_reactivation_logs_tenantId_leadId_idx" ON "lead_reactivation_logs"("tenantId", "leadId");

ALTER TABLE "lead_reactivation_logs"
  ADD CONSTRAINT "lead_reactivation_logs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_reactivation_logs"
  ADD CONSTRAINT "lead_reactivation_logs_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_reactivation_logs"
  ADD CONSTRAINT "lead_reactivation_logs_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deals" ADD COLUMN "business_unit_id" TEXT;
CREATE INDEX "deals_tenantId_business_unit_id_idx" ON "deals"("tenantId", "business_unit_id");
ALTER TABLE "deals"
  ADD CONSTRAINT "deals_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "customers" ADD COLUMN "business_unit_id" TEXT;
ALTER TABLE "customers" ADD COLUMN "interest_categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX "customers_tenantId_business_unit_id_idx" ON "customers"("tenantId", "business_unit_id");
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads" ADD COLUMN "last_interaction_at" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "business_unit_id" TEXT;
ALTER TABLE "leads" ADD COLUMN "interest_categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "leads" ADD COLUMN "lost_reason" TEXT;
ALTER TABLE "leads" ADD COLUMN "lost_at" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "reactivation_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "leads" ADD COLUMN "reactivation_days" INTEGER;
ALTER TABLE "leads" ADD COLUMN "reactivation_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN "next_reactivation_at" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "last_reactivated_at" TIMESTAMP(3);

UPDATE "leads"
SET "last_interaction_at" = "lastContactAt"
WHERE "lastContactAt" IS NOT NULL;

UPDATE "leads"
SET "lost_at" = "updatedAt"
WHERE "status" = 'lost' AND "lost_at" IS NULL;

CREATE INDEX "leads_tenantId_business_unit_id_idx" ON "leads"("tenantId", "business_unit_id");
CREATE INDEX "leads_tenantId_status_next_reactivation_at_idx" ON "leads"("tenantId", "status", "next_reactivation_at");

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
