-- AlterTable
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "product_type" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "deals_tenantId_product_type_idx" ON "deals"("tenantId", "product_type");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "sales_targets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT,
    "user_id" TEXT,
    "team_id" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "target_deals" INTEGER NOT NULL DEFAULT 0,
    "target_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "achieved_deals" INTEGER NOT NULL DEFAULT 0,
    "achieved_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "scope_key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_commissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT,
    "business_unit_id" TEXT,
    "commission_percentage" DECIMAL(6,2) NOT NULL,
    "commission_value" DECIMAL(14,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "commission_percentage" DECIMAL(6,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sales_targets_tenantId_scope_key_month_year_key" ON "sales_targets"("tenantId", "scope_key", "month", "year");
CREATE INDEX "sales_targets_tenantId_year_month_idx" ON "sales_targets"("tenantId", "year", "month");
CREATE INDEX "sales_targets_tenantId_user_id_idx" ON "sales_targets"("tenantId", "user_id");
CREATE INDEX "sales_targets_tenantId_business_unit_id_idx" ON "sales_targets"("tenantId", "business_unit_id");
CREATE INDEX "sales_targets_tenantId_team_id_idx" ON "sales_targets"("tenantId", "team_id");

CREATE UNIQUE INDEX "sales_commissions_deal_id_key" ON "sales_commissions"("deal_id");
CREATE INDEX "sales_commissions_tenantId_status_idx" ON "sales_commissions"("tenantId", "status");
CREATE INDEX "sales_commissions_tenantId_user_id_idx" ON "sales_commissions"("tenantId", "user_id");
CREATE INDEX "sales_commissions_tenantId_business_unit_id_idx" ON "sales_commissions"("tenantId", "business_unit_id");

CREATE UNIQUE INDEX "commission_rules_tenantId_business_unit_id_product_type_key" ON "commission_rules"("tenantId", "business_unit_id", "product_type");
CREATE INDEX "commission_rules_tenantId_is_active_idx" ON "commission_rules"("tenantId", "is_active");

ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
