-- Business Unit membership (N:N) + contexto ativo do usuário

CREATE TABLE "user_business_units" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_business_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_business_units_user_id_business_unit_id_key"
  ON "user_business_units"("user_id", "business_unit_id");
CREATE INDEX "user_business_units_business_unit_id_idx" ON "user_business_units"("business_unit_id");
CREATE INDEX "user_business_units_user_id_idx" ON "user_business_units"("user_id");

ALTER TABLE "user_business_units"
  ADD CONSTRAINT "user_business_units_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_business_units"
  ADD CONSTRAINT "user_business_units_business_unit_id_fkey"
  FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN "current_business_unit_id" TEXT;
CREATE INDEX "users_current_business_unit_id_idx" ON "users"("current_business_unit_id");
ALTER TABLE "users"
  ADD CONSTRAINT "users_current_business_unit_id_fkey"
  FOREIGN KEY ("current_business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
