-- CRM-004 Evolution API: status `read`, messageId e timestamps de entrega/leitura

ALTER TYPE "CommunicationStatus" ADD VALUE 'read';

ALTER TABLE "communication_logs" ADD COLUMN "message_id" TEXT;
ALTER TABLE "communication_logs" ADD COLUMN "delivered_at" TIMESTAMP(3);
ALTER TABLE "communication_logs" ADD COLUMN "read_at" TIMESTAMP(3);

CREATE INDEX "communication_logs_tenantId_message_id_idx"
  ON "communication_logs"("tenantId", "message_id");
