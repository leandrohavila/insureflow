-- Customers (multi-tenant)

CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_tenantId_document_key" ON "customers"("tenantId", "document");
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
CREATE INDEX "customers_tenantId_type_idx" ON "customers"("tenantId", "type");
CREATE INDEX "customers_tenantId_status_idx" ON "customers"("tenantId", "status");
CREATE INDEX "customers_tenantId_email_idx" ON "customers"("tenantId", "email");
CREATE INDEX "customers_tenantId_createdAt_idx" ON "customers"("tenantId", "createdAt");

ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
