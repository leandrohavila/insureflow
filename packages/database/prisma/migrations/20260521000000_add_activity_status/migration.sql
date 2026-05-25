-- AlterTable: add operational status field to activities
-- Default 'pending' ensures all existing activities remain visible in the agenda
ALTER TABLE "activities" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "activities_tenantId_status_idx" ON "activities"("tenantId", "status");
