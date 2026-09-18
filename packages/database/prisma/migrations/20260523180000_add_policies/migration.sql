-- Apólices (pós-venda) vinculadas a clientes e opcionalmente a negócios

CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "dealId" TEXT,
    "insurer" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "productLine" TEXT NOT NULL,
    "modality" TEXT,
    "premiumValue" DECIMAL(14,2) NOT NULL,
    "commissionValue" DECIMAL(14,2),
    "issuedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "renewalStatus" TEXT,
    "brokerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "policies_tenantId_policyNumber_key" ON "policies"("tenantId", "policyNumber");
CREATE INDEX "policies_tenantId_idx" ON "policies"("tenantId");
CREATE INDEX "policies_tenantId_customerId_idx" ON "policies"("tenantId", "customerId");
CREATE INDEX "policies_tenantId_dealId_idx" ON "policies"("tenantId", "dealId");
CREATE INDEX "policies_tenantId_status_idx" ON "policies"("tenantId", "status");
CREATE INDEX "policies_tenantId_renewalStatus_idx" ON "policies"("tenantId", "renewalStatus");
CREATE INDEX "policies_tenantId_effectiveTo_idx" ON "policies"("tenantId", "effectiveTo");
CREATE INDEX "policies_tenantId_brokerUserId_idx" ON "policies"("tenantId", "brokerUserId");
CREATE INDEX "policies_tenantId_insurer_idx" ON "policies"("tenantId", "insurer");

ALTER TABLE "policies" ADD CONSTRAINT "policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_brokerUserId_fkey" FOREIGN KEY ("brokerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
