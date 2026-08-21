-- CRM-006 Sales pipeline inteligente: origem, score, pipelines, SLA e histórico

CREATE TYPE "DealSourceType" AS ENUM ('LEAD', 'RENEWAL', 'CROSS_SELL', 'MANUAL', 'REACTIVATION');
CREATE TYPE "DealScore" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "PipelineAlertTarget" AS ENUM ('OWNER', 'MANAGER');

CREATE TABLE "business_unit_pipelines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_unit_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_unit_pipelines_business_unit_id_key" ON "business_unit_pipelines"("business_unit_id");
CREATE INDEX "business_unit_pipelines_tenantId_idx" ON "business_unit_pipelines"("tenantId");

ALTER TABLE "business_unit_pipelines"
  ADD CONSTRAINT "business_unit_pipelines_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_unit_pipelines"
  ADD CONSTRAINT "business_unit_pipelines_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "max_days" INTEGER,
    "alert_target" "PipelineAlertTarget",
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pipeline_stages_pipeline_id_slug_key" ON "pipeline_stages"("pipeline_id", "slug");
CREATE INDEX "pipeline_stages_pipeline_id_sort_order_idx" ON "pipeline_stages"("pipeline_id", "sort_order");

ALTER TABLE "pipeline_stages"
  ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey"
  FOREIGN KEY ("pipeline_id") REFERENCES "business_unit_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deals"
  ADD COLUMN "pipeline_id" TEXT,
  ADD COLUMN "source_type" "DealSourceType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "source_id" TEXT,
  ADD COLUMN "score" "DealScore" NOT NULL DEFAULT 'LOW',
  ADD COLUMN "stage_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "deals_tenantId_pipeline_id_idx" ON "deals"("tenantId", "pipeline_id");
CREATE INDEX "deals_tenantId_source_type_idx" ON "deals"("tenantId", "source_type");
CREATE INDEX "deals_tenantId_score_idx" ON "deals"("tenantId", "score");
CREATE INDEX "deals_tenantId_stage_entered_at_idx" ON "deals"("tenantId", "stage_entered_at");

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_pipeline_id_fkey"
  FOREIGN KEY ("pipeline_id") REFERENCES "business_unit_pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_stage_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "from_stage" TEXT,
    "to_stage" TEXT NOT NULL,
    "pipeline_id" TEXT,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exited_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "performed_by_id" TEXT,

    CONSTRAINT "deal_stage_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_stage_history_tenantId_deal_id_idx" ON "deal_stage_history"("tenantId", "deal_id");
CREATE INDEX "deal_stage_history_tenantId_entered_at_idx" ON "deal_stage_history"("tenantId", "entered_at");
CREATE INDEX "deal_stage_history_deal_id_entered_at_idx" ON "deal_stage_history"("deal_id", "entered_at");

ALTER TABLE "deal_stage_history"
  ADD CONSTRAINT "deal_stage_history_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_stage_history"
  ADD CONSTRAINT "deal_stage_history_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_stage_history"
  ADD CONSTRAINT "deal_stage_history_performed_by_id_fkey"
  FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "deals" SET "stage_entered_at" = "createdAt";

UPDATE "deals" d
SET "stage" = CASE
  WHEN bu.type = 'REAL_ESTATE' AND d.stage = 'qualificacao' THEN 'visita'
  WHEN bu.type = 'REAL_ESTATE' AND d.stage = 'negociacao' THEN 'contrato'
  WHEN d.stage = 'qualificacao' THEN 'contato'
  WHEN d.stage = 'negociacao' THEN 'proposta'
  WHEN d.stage = 'fechado' THEN 'fechamento'
  ELSE d.stage
END
FROM "business_units" bu
WHERE d.business_unit_id = bu.id
  AND d.stage IN ('qualificacao', 'negociacao', 'fechado');

UPDATE "deals"
SET "stage" = 'fechamento'
WHERE "stage" = 'fechado';
