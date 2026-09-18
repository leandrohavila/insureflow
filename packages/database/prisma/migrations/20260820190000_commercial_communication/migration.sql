-- Camada de comunicação comercial (provider pattern) — additive only

CREATE TYPE "CommunicationProviderKind" AS ENUM ('INTERNAL', 'EVOLUTION', 'META', 'ZAPI', 'TWILIO');
CREATE TYPE "CommunicationDirection" AS ENUM ('OUTBOUND', 'INBOUND');
CREATE TYPE "CommunicationPurpose" AS ENUM ('REACTIVATION', 'FOLLOW_UP', 'RENEWAL', 'CROSS_SELL', 'MANUAL');
CREATE TYPE "CommunicationStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'replied');

CREATE TABLE "communication_provider_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "CommunicationProviderKind" NOT NULL DEFAULT 'INTERNAL',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_provider_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "communication_provider_configs_tenantId_key" ON "communication_provider_configs"("tenantId");

ALTER TABLE "communication_provider_configs"
  ADD CONSTRAINT "communication_provider_configs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "CommunicationProviderKind" NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL DEFAULT 'OUTBOUND',
    "purpose" "CommunicationPurpose" NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'queued',
    "lead_id" TEXT,
    "customer_id" TEXT,
    "template_id" TEXT,
    "performed_by_id" TEXT,
    "to" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "external_id" TEXT,
    "error_message" TEXT,
    "reply_content" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sent_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "communication_logs_tenantId_createdAt_idx" ON "communication_logs"("tenantId", "createdAt");
CREATE INDEX "communication_logs_tenantId_status_idx" ON "communication_logs"("tenantId", "status");
CREATE INDEX "communication_logs_tenantId_purpose_idx" ON "communication_logs"("tenantId", "purpose");
CREATE INDEX "communication_logs_tenantId_provider_idx" ON "communication_logs"("tenantId", "provider");
CREATE INDEX "communication_logs_tenantId_lead_id_idx" ON "communication_logs"("tenantId", "lead_id");
CREATE INDEX "communication_logs_tenantId_customer_id_idx" ON "communication_logs"("tenantId", "customer_id");
CREATE INDEX "communication_logs_tenantId_external_id_idx" ON "communication_logs"("tenantId", "external_id");

ALTER TABLE "communication_logs"
  ADD CONSTRAINT "communication_logs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_logs"
  ADD CONSTRAINT "communication_logs_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_logs"
  ADD CONSTRAINT "communication_logs_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_logs"
  ADD CONSTRAINT "communication_logs_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_logs"
  ADD CONSTRAINT "communication_logs_performed_by_id_fkey"
  FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
