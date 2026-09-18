-- CreateEnum
CREATE TYPE "ReactivationCampaignStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "CampaignLeadContactStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'NO_RESPONSE', 'INTERESTED', 'REACTIVATED', 'CLOSED');

-- CreateTable
CREATE TABLE "reactivation_campaigns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_user_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "status" "ReactivationCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "business_unit_id" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reactivation_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "contact_status" "CampaignLeadContactStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "added_by_id" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contacted_at" TIMESTAMP(3),
    "reactivated_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "campaign_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reactivation_campaigns_tenantId_idx" ON "reactivation_campaigns"("tenantId");

-- CreateIndex
CREATE INDEX "reactivation_campaigns_tenantId_status_idx" ON "reactivation_campaigns"("tenantId", "status");

-- CreateIndex
CREATE INDEX "reactivation_campaigns_tenantId_owner_user_id_idx" ON "reactivation_campaigns"("tenantId", "owner_user_id");

-- CreateIndex
CREATE INDEX "reactivation_campaigns_tenantId_business_unit_id_idx" ON "reactivation_campaigns"("tenantId", "business_unit_id");

-- CreateIndex
CREATE INDEX "campaign_leads_tenantId_idx" ON "campaign_leads"("tenantId");

-- CreateIndex
CREATE INDEX "campaign_leads_tenantId_campaign_id_idx" ON "campaign_leads"("tenantId", "campaign_id");

-- CreateIndex
CREATE INDEX "campaign_leads_tenantId_lead_id_idx" ON "campaign_leads"("tenantId", "lead_id");

-- CreateIndex
CREATE INDEX "campaign_leads_campaign_id_contact_status_idx" ON "campaign_leads"("campaign_id", "contact_status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_leads_campaign_id_lead_id_key" ON "campaign_leads"("campaign_id", "lead_id");

-- AddForeignKey
ALTER TABLE "reactivation_campaigns" ADD CONSTRAINT "reactivation_campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactivation_campaigns" ADD CONSTRAINT "reactivation_campaigns_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactivation_campaigns" ADD CONSTRAINT "reactivation_campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactivation_campaigns" ADD CONSTRAINT "reactivation_campaigns_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_leads" ADD CONSTRAINT "campaign_leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_leads" ADD CONSTRAINT "campaign_leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "reactivation_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_leads" ADD CONSTRAINT "campaign_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_leads" ADD CONSTRAINT "campaign_leads_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
