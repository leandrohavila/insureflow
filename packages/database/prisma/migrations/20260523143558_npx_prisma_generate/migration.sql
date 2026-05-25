/*
  Warnings:

  - A unique constraint covering the columns `[sourceDealId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "operationalEventKind" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "lifecycleStage" TEXT NOT NULL DEFAULT 'won',
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "renewalPipeline" TEXT,
ADD COLUMN     "renewalStatus" TEXT,
ADD COLUMN     "sourceDealId" TEXT;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "wonAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "customers_sourceDealId_key" ON "customers"("sourceDealId");

-- CreateIndex
CREATE INDEX "customers_tenantId_lifecycleStage_idx" ON "customers"("tenantId", "lifecycleStage");

-- CreateIndex
CREATE INDEX "customers_tenantId_phone_idx" ON "customers"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "customers_tenantId_renewalDate_idx" ON "customers"("tenantId", "renewalDate");

-- CreateIndex
CREATE INDEX "deals_tenantId_customerId_idx" ON "deals"("tenantId", "customerId");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_sourceDealId_fkey" FOREIGN KEY ("sourceDealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
