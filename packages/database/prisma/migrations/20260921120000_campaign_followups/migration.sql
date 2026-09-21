-- AlterTable
ALTER TABLE "lead_follow_ups" ADD COLUMN "campaign_id" TEXT;

-- CreateIndex
CREATE INDEX "lead_follow_ups_tenantId_campaign_id_idx" ON "lead_follow_ups"("tenantId", "campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_follow_ups_campaign_id_lead_id_key" ON "lead_follow_ups"("campaign_id", "leadId");

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "reactivation_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
