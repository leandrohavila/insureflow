-- Sprint 8.1 Conversão (Opção A):
-- property_id nullable (lead genérico / atendimento geral)
-- metadata JSONB (UTM, gclid, fbclid, landing, placement)
-- FK ON DELETE SET NULL (lead sobrevive à exclusão do imóvel)
-- Sem DROP de dados. Leads existentes: property_id intacto, metadata NULL.
--
-- Apply: HML → API → portal.
-- Rollback: só reverter nullability se não houver leads genéricos em produção
-- (nova migration corretiva; não editar esta pasta).

-- DropForeignKey
ALTER TABLE "property_leads" DROP CONSTRAINT "property_leads_property_id_fkey";

-- AlterTable
ALTER TABLE "property_leads" ALTER COLUMN "property_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "property_leads" ADD COLUMN "metadata" JSONB;

-- AddForeignKey
ALTER TABLE "property_leads" ADD CONSTRAINT "property_leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "property_leads_tenantId_source_idx" ON "property_leads"("tenantId", "source");
