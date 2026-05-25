-- Lead: documento comercial, último contato e índice para deduplicação por tenant
ALTER TABLE "leads" ADD COLUMN "documentType" TEXT;
ALTER TABLE "leads" ADD COLUMN "document" TEXT;
ALTER TABLE "leads" ADD COLUMN "lastContactAt" TIMESTAMP(3);

CREATE INDEX "leads_tenantId_document_idx" ON "leads"("tenantId", "document");
