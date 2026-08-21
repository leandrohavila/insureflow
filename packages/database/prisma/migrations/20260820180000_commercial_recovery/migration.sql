-- Recuperação comercial: motivos de perda, follow-ups e fila de renovação
-- Additive only — não altera colunas existentes de policies/leads além de FK opcional.

CREATE TYPE "FollowUpType" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING');
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CommercialRenewalStatus" AS ENUM (
  'ACTIVE',
  'RENEWAL_PENDING',
  'RENEWAL_IN_PROGRESS',
  'RENEWED',
  'LOST'
);

CREATE TABLE "lead_loss_reasons" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reactivation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reactivation_days" INTEGER NOT NULL DEFAULT 30,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_loss_reasons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lead_loss_reasons_tenantId_name_key" ON "lead_loss_reasons"("tenantId", "name");
CREATE INDEX "lead_loss_reasons_tenantId_idx" ON "lead_loss_reasons"("tenantId");
CREATE INDEX "lead_loss_reasons_tenantId_is_active_idx" ON "lead_loss_reasons"("tenantId", "is_active");
CREATE INDEX "lead_loss_reasons_tenantId_business_unit_id_idx" ON "lead_loss_reasons"("tenantId", "business_unit_id");

ALTER TABLE "lead_loss_reasons"
  ADD CONSTRAINT "lead_loss_reasons_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_loss_reasons"
  ADD CONSTRAINT "lead_loss_reasons_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lead_follow_ups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "type" "FollowUpType" NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "assigned_user_id" TEXT,
    "business_unit_id" TEXT,
    "alerted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_follow_ups_tenantId_status_scheduled_at_idx" ON "lead_follow_ups"("tenantId", "status", "scheduled_at");
CREATE INDEX "lead_follow_ups_tenantId_assigned_user_id_idx" ON "lead_follow_ups"("tenantId", "assigned_user_id");
CREATE INDEX "lead_follow_ups_tenantId_leadId_idx" ON "lead_follow_ups"("tenantId", "leadId");
CREATE INDEX "lead_follow_ups_tenantId_business_unit_id_idx" ON "lead_follow_ups"("tenantId", "business_unit_id");

ALTER TABLE "lead_follow_ups"
  ADD CONSTRAINT "lead_follow_ups_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_follow_ups"
  ADD CONSTRAINT "lead_follow_ups_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_follow_ups"
  ADD CONSTRAINT "lead_follow_ups_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_follow_ups"
  ADD CONSTRAINT "lead_follow_ups_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lead_follow_ups"
  ADD CONSTRAINT "lead_follow_ups_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "policy_renewals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "policy_id" TEXT,
    "policy_number" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "renewal_date" TIMESTAMP(3) NOT NULL,
    "status" "CommercialRenewalStatus" NOT NULL DEFAULT 'ACTIVE',
    "assigned_user_id" TEXT,
    "business_unit_id" TEXT,
    "deal_id" TEXT,
    "task_created_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),
    "opportunity_created_at" TIMESTAMP(3),
    "converted_revenue" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_renewals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "policy_renewals_tenantId_status_renewal_date_idx" ON "policy_renewals"("tenantId", "status", "renewal_date");
CREATE INDEX "policy_renewals_tenantId_client_id_idx" ON "policy_renewals"("tenantId", "client_id");
CREATE INDEX "policy_renewals_tenantId_assigned_user_id_idx" ON "policy_renewals"("tenantId", "assigned_user_id");
CREATE INDEX "policy_renewals_tenantId_business_unit_id_idx" ON "policy_renewals"("tenantId", "business_unit_id");
CREATE INDEX "policy_renewals_tenantId_policy_id_idx" ON "policy_renewals"("tenantId", "policy_id");

ALTER TABLE "policy_renewals"
  ADD CONSTRAINT "policy_renewals_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policy_renewals"
  ADD CONSTRAINT "policy_renewals_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policy_renewals"
  ADD CONSTRAINT "policy_renewals_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policy_renewals"
  ADD CONSTRAINT "policy_renewals_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policy_renewals"
  ADD CONSTRAINT "policy_renewals_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policy_renewals"
  ADD CONSTRAINT "policy_renewals_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads" ADD COLUMN "loss_reason_id" TEXT;
CREATE INDEX "leads_tenantId_loss_reason_id_idx" ON "leads"("tenantId", "loss_reason_id");
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_loss_reason_id_fkey"
  FOREIGN KEY ("loss_reason_id") REFERENCES "lead_loss_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
