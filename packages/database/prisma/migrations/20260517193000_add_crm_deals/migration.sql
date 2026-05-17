-- CRM deals (multi-tenant)

CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'novo',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deals_tenantId_idx" ON "deals"("tenantId");
CREATE INDEX "deals_tenantId_stage_idx" ON "deals"("tenantId", "stage");
CREATE INDEX "deals_tenantId_status_idx" ON "deals"("tenantId", "status");
CREATE INDEX "deals_tenantId_assignedTo_idx" ON "deals"("tenantId", "assignedTo");

ALTER TABLE "deals" ADD CONSTRAINT "deals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
