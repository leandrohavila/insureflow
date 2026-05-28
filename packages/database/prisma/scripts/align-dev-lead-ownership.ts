/**
 * Fase 6/7 — alinha ownership dos leads dev/HML para o comercial + equipe.
 * Uso: APP_ENV=development npm run db:align:dev-lead-ownership -w @repo/database
 */
import path from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

const monorepoRoot = path.resolve(__dirname, '../../../..');
const appEnv = process.env.APP_ENV ?? 'development';
for (const file of ['.env', `.env.${appEnv}`]) {
  config({ path: path.join(monorepoRoot, file), override: true });
}
if (process.env.DATABASE_URL_DIRECT) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
}

const prisma = new PrismaClient();
const TENANT_SLUG = process.env.TENANT_SLUG ?? 'insureflow';

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) throw new Error(`Tenant not found: ${TENANT_SLUG}`);

  const comercial = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'comercial@insureflow.com' },
    },
    select: { id: true, name: true, email: true, primaryTeamId: true },
  });
  if (!comercial) throw new Error('comercial@insureflow.com not found — run seed first');

  const team = await prisma.team.findUnique({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'equipe-comercial' },
    },
    select: { id: true },
  });

  const ownerTeamId = comercial.primaryTeamId ?? team?.id ?? null;

  const leadsBefore = await prisma.lead.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      name: true,
      assignedTo: true,
      ownerUserId: true,
      ownerTeamId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const toFix = leadsBefore.filter((l) => l.ownerUserId !== comercial.id);
  let updated = 0;

  for (const lead of toFix) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        assignedTo: comercial.name,
        ownerUserId: comercial.id,
        ownerTeamId,
      },
    });
    updated++;
  }

  const parceiro = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'parceiro@insureflow.com' },
    },
    select: { id: true },
  });

  let shareEnsured = 0;
  if (parceiro) {
    const demoLead = await prisma.lead.findFirst({
      where: { tenantId: tenant.id, ownerUserId: comercial.id },
      orderBy: { createdAt: 'asc' },
    });
    if (demoLead) {
      await prisma.leadShare.upsert({
        where: {
          leadId_sharedWithUserId: {
            leadId: demoLead.id,
            sharedWithUserId: parceiro.id,
          },
        },
        create: {
          tenantId: tenant.id,
          leadId: demoLead.id,
          sharedWithUserId: parceiro.id,
          sharedByUserId: comercial.id,
          permission: 'read',
        },
        update: { revokedAt: null },
      });
      shareEnsured = 1;
    }
  }

  const leadsAfter = await prisma.lead.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      name: true,
      assignedTo: true,
      ownerUserId: true,
      ownerTeamId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(
    JSON.stringify(
      {
        tenant: TENANT_SLUG,
        comercial: { id: comercial.id, name: comercial.name, ownerTeamId },
        updated,
        shareEnsured,
        before: leadsBefore,
        after: leadsAfter,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
