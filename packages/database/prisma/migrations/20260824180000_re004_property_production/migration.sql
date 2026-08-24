-- CreateEnum
CREATE TYPE "PersonKind" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "PropertyFeatureValueType" AS ENUM ('BOOLEAN', 'TEXT', 'NUMBER');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "featured_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "PersonKind" NOT NULL DEFAULT 'INDIVIDUAL',
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "customer_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_owners" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "public_visible" BOOLEAN NOT NULL DEFAULT false,
    "share_percent" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_feature_definitions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value_type" "PropertyFeatureValueType" NOT NULL DEFAULT 'BOOLEAN',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_feature_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_features" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "value_boolean" BOOLEAN,
    "value_text" TEXT,
    "value_number" DECIMAL(14,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_features_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "persons_customer_id_key" ON "persons"("customer_id");
CREATE INDEX "persons_tenantId_idx" ON "persons"("tenantId");
CREATE INDEX "persons_tenantId_name_idx" ON "persons"("tenantId", "name");

CREATE UNIQUE INDEX "property_owners_property_id_person_id_key" ON "property_owners"("property_id", "person_id");
CREATE INDEX "property_owners_tenantId_property_id_idx" ON "property_owners"("tenantId", "property_id");
CREATE INDEX "property_owners_person_id_idx" ON "property_owners"("person_id");

CREATE UNIQUE INDEX "property_feature_definitions_tenantId_key_key" ON "property_feature_definitions"("tenantId", "key");
CREATE INDEX "property_feature_definitions_tenantId_is_active_idx" ON "property_feature_definitions"("tenantId", "is_active");

CREATE UNIQUE INDEX "property_features_property_id_definition_id_key" ON "property_features"("property_id", "definition_id");
CREATE INDEX "property_features_tenantId_property_id_idx" ON "property_features"("tenantId", "property_id");

CREATE INDEX "properties_tenantId_featured_featured_until_idx" ON "properties"("tenantId", "featured", "featured_until");

ALTER TABLE "persons" ADD CONSTRAINT "persons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "persons" ADD CONSTRAINT "persons_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "property_feature_definitions" ADD CONSTRAINT "property_feature_definitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_features" ADD CONSTRAINT "property_features_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_features" ADD CONSTRAINT "property_features_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_features" ADD CONSTRAINT "property_features_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "property_feature_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
