/**
 * Remove dados operacionais de demonstração/homologação do tenant principal.
 * Preserva: schema, migrations, tenants, users, roles, permissions, RBAC.
 *
 * Uso:
 *   npx ts-node --project tsconfig.json prisma/prod-clean-demo-data.ts --dry-run
 *   CONFIRM_PROD_CLEAN=YES-I-UNDERSTAND npx ts-node ... --execute
 *
 * Variáveis:
 *   TENANT_SLUG (default: insureflow)
 *   DATABASE_URL ou DATABASE_URL_DIRECT
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TENANT_SLUG = process.env.TENANT_SLUG?.trim() || 'insureflow';
const CONFIRM_TOKEN = 'YES-I-UNDERSTAND';

/** E-mails nunca removidos (apenas informativo — usuários não são apagados). */
const PROTECTED_ADMIN_EMAILS = [
  'leandro@corretoraavila.com.br',
  'admin@insureflow.com',
] as const;

type Counts = Record<string, number>;

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || !args.includes('--execute'),
    execute: args.includes('--execute'),
    reportOnly: args.includes('--report'),
  };
}

async function countTenantData(tenantId: string): Promise<Counts> {
  const [
    questionnaireSubmissions,
    activities,
    policies,
    deals,
    leads,
    customers,
    questionnaireFields,
    questionnaireTemplates,
    refreshTokens,
    auditLogs,
    users,
  ] = await Promise.all([
    prisma.questionnaireSubmission.count({ where: { tenantId } }),
    prisma.activity.count({ where: { tenantId } }),
    prisma.policy.count({ where: { tenantId } }),
    prisma.deal.count({ where: { tenantId } }),
    prisma.lead.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.questionnaireField.count({ where: { tenantId } }),
    prisma.questionnaireTemplate.count({ where: { tenantId } }),
    prisma.refreshToken.count({ where: { tenantId } }),
    prisma.auditLog.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId } }),
  ]);

  return {
    questionnaire_submissions: questionnaireSubmissions,
    activities,
    policies,
    deals,
    leads,
    customers,
    questionnaire_fields: questionnaireFields,
    questionnaire_templates: questionnaireTemplates,
    refresh_tokens: refreshTokens,
    audit_logs: auditLogs,
    users_preserved: users,
  };
}

function printReport(params: {
  tenantSlug: string;
  tenantId: string;
  counts: Counts;
  mode: 'dry-run' | 'execute' | 'report';
}) {
  const { tenantSlug, tenantId, counts, mode } = params;
  const totalOperational =
    counts.questionnaire_submissions +
    counts.activities +
    counts.policies +
    counts.deals +
    counts.leads +
    counts.customers +
    counts.questionnaire_fields +
    counts.questionnaire_templates +
    counts.refresh_tokens +
    counts.audit_logs;

  console.log('\n=== Relatório — limpeza dados demo (produção) ===\n');
  console.log('Modo:', mode);
  console.log('Tenant:', tenantSlug, `(${tenantId})`);
  console.log('Admins preservados (usuários intactos):', PROTECTED_ADMIN_EMAILS.join(', '));
  console.log('\n--- Tabelas afetadas (ordem de DELETE) ---');
  console.log('1. questionnaire_submissions →', counts.questionnaire_submissions);
  console.log('2. activities                 →', counts.activities);
  console.log('3. policies                   →', counts.policies);
  console.log('4. deals                      →', counts.deals);
  console.log('5. leads                      →', counts.leads);
  console.log('6. customers                  →', counts.customers);
  console.log('7. questionnaire_fields       →', counts.questionnaire_fields);
  console.log('8. questionnaire_templates    →', counts.questionnaire_templates);
  console.log('9. refresh_tokens             →', counts.refresh_tokens);
  console.log('10. audit_logs                →', counts.audit_logs);
  console.log('\nTotal registros operacionais:', totalOperational);
  console.log('Usuários no tenant (preservados):', counts.users_preserved);

  console.log('\n--- Fora do escopo Prisma (manual se existir) ---');
  console.log('- uploads/arquivos em storage externo');
  console.log('- filas BullMQ / Redis (jobs pendentes)');
  console.log('- contatos/empresas/tarefas/agenda: modelos não existem; atividades cobrem interações');
  console.log('- cotações/sinistros: permissões existem; tabelas ainda não no schema');

  console.log('\n--- Dependências FK (ordem respeitada) ---');
  console.log(
    'Submissions → Activities/Policies → Deals → Leads/Customers → Templates/Fields → Tokens/Audit',
  );

  console.log('\n--- Riscos ---');
  console.log('- Irreversível sem backup Neon (recomende branch/restore point antes do --execute)');
  console.log('- Sessões ativas invalidadas (refresh_tokens apagados)');
  console.log('- CRM/questionários ficam vazios até novo cadastro');

  console.log('\n--- Rollback ---');
  console.log('- Restore do snapshot/branch Neon anterior à execução');
  console.log('- Não há rollback automático neste script');

  if (mode === 'dry-run') {
    console.log('\n--- Próximo passo ---');
    console.log(
      'CONFIRM_PROD_CLEAN=YES-I-UNDERSTAND npm run prod:clean-demo-data -- --execute',
    );
  }
}

async function cleanTenantData(tenantId: string): Promise<Counts> {
  const before = await countTenantData(tenantId);

  await prisma.$transaction(async (tx) => {
    const deleted: Counts = {};

    deleted.questionnaire_submissions = (
      await tx.questionnaireSubmission.deleteMany({ where: { tenantId } })
    ).count;
    deleted.activities = (await tx.activity.deleteMany({ where: { tenantId } })).count;
    deleted.policies = (await tx.policy.deleteMany({ where: { tenantId } })).count;
    deleted.deals = (await tx.deal.deleteMany({ where: { tenantId } })).count;
    deleted.leads = (await tx.lead.deleteMany({ where: { tenantId } })).count;
    deleted.customers = (await tx.customer.deleteMany({ where: { tenantId } })).count;
    deleted.questionnaire_templates = (
      await tx.questionnaireTemplate.deleteMany({ where: { tenantId } })
    ).count;
    deleted.questionnaire_fields = 0;
    deleted.refresh_tokens = (
      await tx.refreshToken.deleteMany({ where: { tenantId } })
    ).count;
    deleted.audit_logs = (await tx.auditLog.deleteMany({ where: { tenantId } })).count;

    console.log('\n[execute] Removidos:', deleted);
    void before;
  });

  return countTenantData(tenantId);
}

async function main() {
  const { dryRun, execute, reportOnly } = parseArgs();

  if (execute && process.env.CONFIRM_PROD_CLEAN !== CONFIRM_TOKEN) {
    console.error(
      `[abort] Defina CONFIRM_PROD_CLEAN=${CONFIRM_TOKEN} para executar em produção.`,
    );
    process.exit(1);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
  });
  if (!tenant) {
    throw new Error(`Tenant "${DEFAULT_TENANT_SLUG}" não encontrado.`);
  }

  const counts = await countTenantData(tenant.id);
  printReport({
    tenantSlug: tenant.slug,
    tenantId: tenant.id,
    counts,
    mode: reportOnly ? 'report' : dryRun ? 'dry-run' : 'execute',
  });

  if (dryRun || reportOnly) {
    console.log('\n[dry-run] Nenhum dado foi alterado.');
    return;
  }

  console.log('\n[execute] Iniciando transação…');
  const after = await cleanTenantData(tenant.id);
  console.log('\n[execute] Concluído. Contagens pós-limpeza:', after);
  console.log(
    '\nOpcional: npm run prod:seed:clean — pipeline/status padrão no tenant.settings',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
