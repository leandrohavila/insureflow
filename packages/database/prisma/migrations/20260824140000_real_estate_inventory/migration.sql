-- CreateEnum
CREATE TYPE "PropertyPurpose" AS ENUM ('SALE', 'RENT', 'SALE_AND_RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'INACTIVE');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "purpose" "PropertyPurpose" NOT NULL,
    "type" "PropertyType" NOT NULL DEFAULT 'OTHER',
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "area_m2" DECIMAL(10,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parking_spots" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'public_portal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "properties_tenantId_slug_key" ON "properties"("tenantId", "slug");
CREATE INDEX "properties_tenantId_business_unit_id_idx" ON "properties"("tenantId", "business_unit_id");
CREATE INDEX "properties_tenantId_published_published_at_idx" ON "properties"("tenantId", "published", "published_at");
CREATE INDEX "properties_tenantId_city_neighborhood_idx" ON "properties"("tenantId", "city", "neighborhood");
CREATE INDEX "properties_tenantId_purpose_price_idx" ON "properties"("tenantId", "purpose", "price");
CREATE INDEX "properties_tenantId_featured_published_idx" ON "properties"("tenantId", "featured", "published");

CREATE INDEX "property_images_property_id_sort_order_idx" ON "property_images"("property_id", "sort_order");
CREATE INDEX "property_images_tenantId_idx" ON "property_images"("tenantId");

CREATE INDEX "property_leads_tenantId_property_id_idx" ON "property_leads"("tenantId", "property_id");
CREATE INDEX "property_leads_tenantId_created_at_idx" ON "property_leads"("tenantId", "created_at");
CREATE INDEX "property_leads_tenantId_business_unit_id_idx" ON "property_leads"("tenantId", "business_unit_id");

ALTER TABLE "properties" ADD CONSTRAINT "properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "property_images" ADD CONSTRAINT "property_images_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_leads" ADD CONSTRAINT "property_leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_leads" ADD CONSTRAINT "property_leads_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "property_leads" ADD CONSTRAINT "property_leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
