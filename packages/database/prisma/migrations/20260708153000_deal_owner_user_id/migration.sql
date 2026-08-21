-- Sprint 6.1.5: ownership direto em negócios (Deal.ownerUserId)

ALTER TABLE "deals" ADD COLUMN "owner_user_id" TEXT;

CREATE INDEX "deals_tenantId_owner_user_id_idx" ON "deals"("tenantId", "owner_user_id");

ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill a partir do lead convertido
UPDATE "deals" AS d
SET "owner_user_id" = l."owner_user_id"
FROM "leads" AS l
WHERE l."dealId" = d."id"
  AND l."owner_user_id" IS NOT NULL
  AND d."owner_user_id" IS NULL;
