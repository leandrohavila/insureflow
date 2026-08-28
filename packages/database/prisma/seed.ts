/**
 * Seed: permissões globais, tenant demo, roles e usuários oficiais de teste.
 *
 * Credenciais:
 * - admin@insureflow.com / Admin@2026!
 * - viewer@insureflow.com / Viewer@2026!
 * - sales@insureflow.com / Sales@2026!  (somente Corretora Ávila)
 * - imoveis@insureflow.com / Imoveis@2026!  (somente Ávila Imóveis)
 * - comercial@insureflow.com / Comercial@2026!
 * - gerencia@insureflow.com / Gerencia@2026!
 * - parceiro@insureflow.com / Parceiro@2026!
 */
import path from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const monorepoRoot = path.resolve(__dirname, '../../..');
const appEnv = process.env.APP_ENV ?? 'development';
for (const file of ['.env', `.env.${appEnv}`]) {
  config({ path: path.join(monorepoRoot, file), override: true });
}
if (process.env.DATABASE_URL_DIRECT) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
}

const prisma = new PrismaClient();

const PERMISSIONS: { key: string; description: string }[] = [
  { key: 'dashboard:view', description: 'Ver dashboard' },
  { key: 'crm:view', description: 'Ver CRM' },
  { key: 'crm:manage', description: 'Gerenciar CRM' },
  { key: 'clients:view', description: 'Ver clientes' },
  { key: 'clients:manage', description: 'Gerenciar clientes' },
  { key: 'leads:view', description: 'Ver leads' },
  { key: 'leads:manage', description: 'Gerenciar leads' },
  { key: 'leads:share', description: 'Compartilhar leads com parceiros' },
  { key: 'questionnaires:view', description: 'Ver questionários' },
  { key: 'questionnaires:manage', description: 'Gerenciar questionários' },
  { key: 'quotes:view', description: 'Ver cotações' },
  { key: 'quotes:manage', description: 'Gerenciar cotações' },
  { key: 'policies:view', description: 'Ver apólices' },
  { key: 'policies:manage', description: 'Gerenciar apólices' },
  { key: 'claims:view', description: 'Ver sinistros' },
  { key: 'claims:manage', description: 'Gerenciar sinistros' },
  { key: 'whatsapp:view', description: 'Ver WhatsApp' },
  { key: 'whatsapp:manage', description: 'Gerenciar WhatsApp' },
  { key: 'automation:view', description: 'Ver automação' },
  { key: 'automation:manage', description: 'Gerenciar automação' },
  { key: 'settings:view', description: 'Ver configurações' },
  { key: 'settings:manage', description: 'Gerenciar configurações' },
  { key: 'business-units:view-all', description: 'Ver todas as unidades de negócio (VIEW_ALL_BUSINESS_UNITS)' },
  { key: 'business-units:manage', description: 'Gerenciar unidades de negócio e vínculos (MANAGE_BUSINESS_UNITS)' },
  { key: 'properties:view', description: 'Ver inventário imobiliário' },
  { key: 'properties:manage', description: 'Gerenciar inventário imobiliário e publicação' },
  { key: 'users:manage', description: 'Gerenciar usuários' },
  { key: 'tenants:manage', description: 'Gerenciar tenant' },
  { key: 'audit:view', description: 'Ver auditoria' },
];

const ROLE_PERMISSIONS = {
  admin: PERMISSIONS.map((p) => p.key),
  viewer: PERMISSIONS.map((p) => p.key).filter((key) => key.endsWith(':view')),
  sales: [
    'crm:manage',
    'leads:manage',
    'clients:view',
    'properties:view',
    'properties:manage',
  ],
} as const;

async function ensureAdminHasPropertyPermissions(
  tenantId: string,
  permByKey: Record<string, string>,
) {
  const required = ['properties:view', 'properties:manage'] as const;
  const adminRole = await prisma.role.findUnique({
    where: { tenantId_slug: { tenantId, slug: 'admin' } },
  });
  if (!adminRole) return;
  for (const key of required) {
    const permissionId = permByKey[key];
    if (!permissionId) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId },
      },
      create: { roleId: adminRole.id, permissionId },
      update: {},
    });
  }
}

const SEED_USERS = [
  {
    email: 'admin@insureflow.com',
    password: 'Admin@2026!',
    name: 'Ana Costa',
    initials: 'AC',
    title: 'Head of Operations',
    roleSlug: 'admin',
  },
  {
    email: 'viewer@insureflow.com',
    password: 'Viewer@2026!',
    name: 'Carlos Viewer',
    initials: 'CV',
    title: 'Auditoria',
    roleSlug: 'viewer',
  },
  {
    email: 'sales@insureflow.com',
    password: 'Sales@2026!',
    name: 'Sofia Sales',
    initials: 'SS',
    title: 'Executiva Comercial',
    roleSlug: 'sales',
  },
  {
    email: 'imoveis@insureflow.com',
    password: 'Imoveis@2026!',
    name: 'Lia Imóveis',
    initials: 'LI',
    title: 'Corretora Imobiliária',
    roleSlug: 'sales',
  },
] as const;

async function main() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: { key: p.key, description: p.description },
      update: { description: p.description },
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'insureflow' },
    create: {
      name: 'InsureFlow Corp',
      slug: 'insureflow',
      status: 'active',
    },
    update: {},
  });

  const allPerms = await prisma.permission.findMany();
  const permByKey = Object.fromEntries(allPerms.map((x) => [x.key, x.id]));

  const roleLabels = {
    admin: {
      name: 'Administrador',
      description: 'Acesso total ao tenant',
    },
    viewer: {
      name: 'Visualizador',
      description: 'Acesso somente leitura',
    },
    sales: {
      name: 'Comercial',
      description: 'Gerencia CRM e leads, visualiza clientes',
    },
  } as const;

  const roles = new Map<string, string>();
  for (const [slug, labels] of Object.entries(roleLabels)) {
    const role = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      create: {
        tenantId: tenant.id,
        slug,
        name: labels.name,
        description: labels.description,
        isSystem: true,
      },
      update: {
        name: labels.name,
        description: labels.description,
        isSystem: true,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const key of ROLE_PERMISSIONS[slug as keyof typeof ROLE_PERMISSIONS]) {
      const permissionId = permByKey[key];
      if (!permissionId) continue;
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId },
      });
    }
    roles.set(slug, role.id);
  }

  await ensureAdminHasPropertyPermissions(tenant.id, permByKey);

  for (const seedUser of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    const user = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: seedUser.email,
        },
      },
      create: {
        tenantId: tenant.id,
        email: seedUser.email,
        passwordHash,
        name: seedUser.name,
        initials: seedUser.initials,
        title: seedUser.title,
        isActive: true,
      },
      update: {
        passwordHash,
        name: seedUser.name,
        initials: seedUser.initials,
        title: seedUser.title,
        isActive: true,
      },
    });

    const roleId = roles.get(seedUser.roleSlug);
    if (!roleId) continue;
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.create({
      data: { userId: user.id, roleId },
    });
  }

  console.log(
    'Seed OK — tenant:',
    tenant.slug,
    'users:',
    SEED_USERS.map((user) => user.email).join(', '),
  );

  const { seedOwnershipFoundation } = await import('./seed-ownership');
  await seedOwnershipFoundation(tenant.slug);

  await seedGroupBusinessDefaults(tenant.id);

  if (process.env.SEED_DEV_DATA === '1') {
    const { seedDevData } = await import('./seed-dev');
    await seedDevData();
  }

  const { seedBusinessUnitHomologation } = await import(
    './seed-business-unit-homologation'
  );
  await seedBusinessUnitHomologation(prisma, tenant.id);
}

async function seedGroupBusinessDefaults(tenantId: string) {
  const units = [
    {
      name: 'Corretora Ávila',
      slug: 'corretora-avila',
      type: 'INSURANCE' as const,
    },
    {
      name: 'Ávila Imóveis',
      slug: 'avila-imoveis',
      type: 'REAL_ESTATE' as const,
    },
  ];

  for (const unit of units) {
    await prisma.businessUnit.upsert({
      where: { tenantId_slug: { tenantId, slug: unit.slug } },
      create: { tenantId, ...unit, isActive: true },
      update: { name: unit.name, type: unit.type, isActive: true },
    });
  }

  await prisma.leadReactivationSetting.upsert({
    where: { tenantId },
    create: {
      tenantId,
      enabled: false,
      idleDays: 30,
      maxAttempts: 3,
      channel: 'WHATSAPP',
    },
    update: {},
  });

  const templates = [
    {
      name: 'Reativação — retorno de interesse',
      channel: 'WHATSAPP' as const,
      kind: 'reactivation',
      content:
        'Olá {{nome}}.\n\nHá algum tempo conversamos sobre {{interesse}}.\nGostaria de verificar se ainda possui interesse.\nPosso ajudar?',
    },
    {
      name: 'Reativação — novidades',
      channel: 'EMAIL' as const,
      kind: 'reactivation',
      content:
        'Olá {{nome}}.\n\nTemos novidades que podem ser interessantes para você sobre {{interesse}} na {{empresa}}.\nPosso te apresentar rapidamente?\n\n{{corretor}}',
    },
  ];

  for (const template of templates) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { tenantId, name: template.name },
    });
    if (existing) {
      await prisma.messageTemplate.update({
        where: { id: existing.id },
        data: { content: template.content, active: true },
      });
      continue;
    }
    await prisma.messageTemplate.create({
      data: { tenantId, ...template, active: true },
    });
  }

  const extraTemplates = [
    {
      name: 'Follow-up — próximo contato',
      channel: 'WHATSAPP' as const,
      kind: 'FOLLOW_UP',
      content:
        'Olá {{nome}}.\n\nPassando para retomar nosso contato sobre {{interesse}} na {{empresa}}.\nQual o melhor horário para falarmos?\n\n{{corretor}}',
    },
    {
      name: 'Renovação — lembrete 30 dias',
      channel: 'WHATSAPP' as const,
      kind: 'RENEWAL',
      content:
        'Olá {{nome}}.\n\nSua apólice de {{produto}} vence em {{vencimento}}.\nPosso antecipar a renovação com a {{empresa}}?\n\n{{corretor}}',
    },
    {
      name: 'Cross-sell — oportunidade',
      channel: 'WHATSAPP' as const,
      kind: 'CROSS_SELL',
      content:
        'Olá {{nome}}.\n\nAlém de {{interesse}}, podemos proteger você também com {{produto}}.\nQuer que eu monte uma simulação?\n\n{{corretor}}',
    },
  ];

  for (const template of extraTemplates) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { tenantId, name: template.name },
    });
    if (existing) {
      await prisma.messageTemplate.update({
        where: { id: existing.id },
        data: { content: template.content, kind: template.kind, active: true },
      });
      continue;
    }
    await prisma.messageTemplate.create({
      data: { tenantId, ...template, active: true },
    });
  }

  const lossReasons = [
    {
      name: 'Sem orçamento',
      description: 'Cliente sem capacidade financeira no momento.',
      reactivationEnabled: true,
      reactivationDays: 45,
      maxAttempts: 2,
    },
    {
      name: 'Não respondeu',
      description: 'Sem retorno após tentativas de contato.',
      reactivationEnabled: true,
      reactivationDays: 15,
      maxAttempts: 3,
    },
    {
      name: 'Já possui corretor',
      description: 'Carteira já atendida por outro corretor.',
      reactivationEnabled: false,
      reactivationDays: 90,
      maxAttempts: 1,
    },
    {
      name: 'Sem interesse no momento',
      description: 'Adiou a contratação sem prazo definido.',
      reactivationEnabled: true,
      reactivationDays: 30,
      maxAttempts: 3,
    },
    {
      name: 'Renovação futura',
      description: 'Apólice vigente; retomada próxima ao vencimento.',
      reactivationEnabled: true,
      reactivationDays: 60,
      maxAttempts: 2,
    },
    {
      name: 'Aguardando decisão',
      description: 'Em análise interna ou familiar.',
      reactivationEnabled: true,
      reactivationDays: 14,
      maxAttempts: 3,
    },
  ];

  for (const reason of lossReasons) {
    await prisma.leadLossReason.upsert({
      where: { tenantId_name: { tenantId, name: reason.name } },
      create: { tenantId, ...reason, isActive: true },
      update: {
        description: reason.description,
        reactivationEnabled: reason.reactivationEnabled,
        reactivationDays: reason.reactivationDays,
        maxAttempts: reason.maxAttempts,
        isActive: true,
      },
    });
  }

  await prisma.communicationProviderConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      kind: 'INTERNAL',
      enabled: true,
      settings: { note: 'Envio interno — sem fornecedor WhatsApp/e-mail' },
    },
    update: {},
  });

  const unitsBySlug = await prisma.businessUnit.findMany({
    where: { tenantId },
    select: { id: true, slug: true },
  });
  const insuranceId = unitsBySlug.find((item) => item.slug === 'corretora-avila')?.id;
  const realEstateId = unitsBySlug.find((item) => item.slug === 'avila-imoveis')?.id;
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, userRoles: { select: { role: { select: { slug: true } } } } },
  });

  for (const user of users) {
    const slugs = user.userRoles.map((item) => item.role.slug);
    const isAdmin = slugs.includes('admin');
    const unitIds = isAdmin
      ? [insuranceId, realEstateId]
      : user.email === 'imoveis@insureflow.com'
        ? [realEstateId]
        : slugs.includes('sales')
          ? [insuranceId]
          : [insuranceId, realEstateId];
    for (const businessUnitId of unitIds) {
      if (!businessUnitId) continue;
      await prisma.userBusinessUnit.upsert({
        where: {
          userId_businessUnitId: { userId: user.id, businessUnitId },
        },
        create: { userId: user.id, businessUnitId },
        update: {},
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
