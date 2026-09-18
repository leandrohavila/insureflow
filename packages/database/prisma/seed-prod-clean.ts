/**
 * Seed mínima pós-limpeza — tenant insureflow operacional vazio.
 * Não cria leads/deals/clientes demo.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = process.env.TENANT_SLUG?.trim() || 'insureflow';

const DEFAULT_PIPELINE_STAGES = [
  { id: 'novo', label: 'Novo' },
  { id: 'qualificacao', label: 'Qualificação' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'fechado', label: 'Fechado' },
] as const;

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    throw new Error(`Tenant "${TENANT_SLUG}" não existe.`);
  }

  const current =
    tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
      ? (tenant.settings as Record<string, unknown>)
      : {};

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      settings: {
        ...current,
        crm: {
          pipelineStages: DEFAULT_PIPELINE_STAGES,
          defaultDealStatus: 'open',
        },
        productionReady: true,
        cleanedAt: new Date().toISOString(),
      },
    },
  });

  console.log('--- Seed produção limpa OK ---');
  console.log('tenant:', TENANT_SLUG);
  console.log('pipeline stages:', DEFAULT_PIPELINE_STAGES.map((s) => s.id).join(', '));
  console.log('Dados operacionais: nenhum (use prod:clean-demo-data antes se necessário).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
