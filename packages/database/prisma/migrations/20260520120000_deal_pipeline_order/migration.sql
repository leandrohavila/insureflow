-- Ordem manual persistente no Kanban CRM
ALTER TABLE "deals" ADD COLUMN "pipelineOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX "deals_tenantId_stage_pipelineOrder_idx"
  ON "deals"("tenantId", "stage", "pipelineOrder");

-- Backfill: espaçamento incremental por tenant + estágio (createdAt asc)
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY "tenantId", stage
      ORDER BY "createdAt" ASC, id ASC
    ) * 1000.0) AS ord
  FROM "deals"
)
UPDATE "deals" AS d
SET "pipelineOrder" = ranked.ord
FROM ranked
WHERE d.id = ranked.id;
