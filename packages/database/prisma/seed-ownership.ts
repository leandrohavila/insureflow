/**
 * Seed Sprint 2: roles oficiais, equipes, usuários de teste multi-persona, LeadShare demo.
 * Invocado por seed.ts após roles base.
 */
import { DataScope, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EXTRA_PERMISSIONS = [
  { key: 'leads:share', description: 'Compartilhar leads com parceiros' },
] as const;

type RoleDef = {
  slug: string;
  name: string;
  description: string;
  defaultDataScope: DataScope;
  permissions: string[];
};

const OFFICIAL_ROLES: RoleDef[] = [
  {
    slug: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao tenant',
    defaultDataScope: 'tenant',
    permissions: [], // preenchido com todas :view + manage abaixo
  },
  {
    slug: 'gerencia',
    name: 'Gerência comercial',
    description: 'Supervisão da equipe comercial',
    defaultDataScope: 'team',
    permissions: [
      'dashboard:view',
      'crm:view',
      'crm:manage',
      'clients:view',
      'clients:manage',
      'leads:view',
      'leads:manage',
      'leads:share',
      'questionnaires:view',
      'questionnaires:manage',
      'quotes:view',
      'quotes:manage',
      'policies:view',
      'audit:view',
      'settings:view',
    ],
  },
  {
    slug: 'comercial',
    name: 'Comercial',
    description: 'Carteira individual de leads e negócios',
    defaultDataScope: 'own',
    permissions: [
      'dashboard:view',
      'crm:view',
      'crm:manage',
      'clients:view',
      'leads:view',
      'leads:manage',
      'leads:share',
      'questionnaires:view',
      'questionnaires:manage',
      'quotes:view',
      'quotes:manage',
      'settings:view',
    ],
  },
  {
    slug: 'operacional',
    name: 'Operacional',
    description: 'Pós-venda e apólices',
    defaultDataScope: 'team',
    permissions: [
      'dashboard:view',
      'clients:view',
      'clients:manage',
      'leads:view',
      'policies:view',
      'policies:manage',
      'claims:view',
      'claims:manage',
      'questionnaires:view',
      'settings:view',
    ],
  },
  {
    slug: 'financeiro',
    name: 'Financeiro',
    description: 'Leitura financeira e apólices',
    defaultDataScope: 'tenant',
    permissions: [
      'dashboard:view',
      'clients:view',
      'policies:view',
      'audit:view',
      'settings:view',
    ],
  },
  {
    slug: 'parceiro',
    name: 'Parceiro externo',
    description: 'Acesso somente a leads compartilhados',
    defaultDataScope: 'shared',
    permissions: ['dashboard:view', 'leads:view'],
  },
  {
    slug: 'leitura',
    name: 'Somente leitura',
    description: 'Visualização do tenant',
    defaultDataScope: 'tenant',
    permissions: [], // todas :view
  },
];

const TEST_USERS = [
  {
    email: 'comercial@insureflow.com',
    password: 'Comercial@2026!',
    name: 'Bruno Comercial',
    initials: 'BC',
    title: 'Corretor',
    roleSlug: 'comercial',
    teamSlug: 'equipe-comercial',
    isTeamLead: false,
  },
  {
    email: 'gerencia@insureflow.com',
    password: 'Gerencia@2026!',
    name: 'Carla Gerência',
    initials: 'CG',
    title: 'Supervisora comercial',
    roleSlug: 'gerencia',
    teamSlug: 'equipe-comercial',
    isTeamLead: true,
  },
  {
    email: 'parceiro@insureflow.com',
    password: 'Parceiro@2026!',
    name: 'Paulo Parceiro',
    initials: 'PP',
    title: 'Parceiro indicador',
    roleSlug: 'parceiro',
    teamSlug: null as string | null,
    isTeamLead: false,
  },
] as const;

export async function seedOwnershipFoundation(tenantSlug = 'insureflow') {
  for (const p of EXTRA_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: { key: p.key, description: p.description },
      update: { description: p.description },
    });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    console.warn('[seed-ownership] tenant not found:', tenantSlug);
    return;
  }

  const allPerms = await prisma.permission.findMany();
  const permByKey = Object.fromEntries(allPerms.map((x) => [x.key, x.id]));
  const allViewKeys = allPerms
    .map((p) => p.key)
    .filter((k) => k.endsWith(':view'));

  const team = await prisma.team.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'equipe-comercial' },
    },
    create: {
      tenantId: tenant.id,
      slug: 'equipe-comercial',
      name: 'Equipe Comercial SP',
      isActive: true,
    },
    update: { name: 'Equipe Comercial SP', isActive: true },
  });

  const roleIds = new Map<string, string>();

  for (const def of OFFICIAL_ROLES) {
    const keys =
      def.slug === 'admin'
        ? allPerms.map((p) => p.key)
        : def.slug === 'leitura'
          ? allViewKeys
          : def.permissions;

    const role = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: def.slug } },
      create: {
        tenantId: tenant.id,
        slug: def.slug,
        name: def.name,
        description: def.description,
        isSystem: true,
        defaultDataScope: def.defaultDataScope,
      },
      update: {
        name: def.name,
        description: def.description,
        isSystem: true,
        defaultDataScope: def.defaultDataScope,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const key of keys) {
      const permissionId = permByKey[key];
      if (!permissionId) continue;
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId },
      });
    }
    roleIds.set(def.slug, role.id);
  }

  // Legacy aliases: sales → comercial permissions, viewer → leitura
  for (const [legacy, target] of [
    ['sales', 'comercial'],
    ['viewer', 'leitura'],
  ] as const) {
    const targetId = roleIds.get(target);
    if (!targetId) continue;
    const legacyRole = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: legacy } },
      create: {
        tenantId: tenant.id,
        slug: legacy,
        name: legacy === 'sales' ? 'Comercial (legado)' : 'Visualizador (legado)',
        description: 'Alias legado — preferir slug oficial',
        isSystem: true,
        defaultDataScope: target === 'comercial' ? 'own' : 'tenant',
      },
      update: {
        defaultDataScope: target === 'comercial' ? 'own' : 'tenant',
      },
    });
    const targetPerms = await prisma.rolePermission.findMany({
      where: { roleId: targetId },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: legacyRole.id } });
    for (const rp of targetPerms) {
      await prisma.rolePermission.create({
        data: { roleId: legacyRole.id, permissionId: rp.permissionId },
      });
    }
  }

  const userIds = new Map<string, string>();

  for (const seedUser of TEST_USERS) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    const user = await prisma.user.upsert({
      where: {
        tenantId_email: { tenantId: tenant.id, email: seedUser.email },
      },
      create: {
        tenantId: tenant.id,
        email: seedUser.email,
        passwordHash,
        name: seedUser.name,
        initials: seedUser.initials,
        title: seedUser.title,
        isActive: true,
        primaryTeamId: seedUser.teamSlug ? team.id : null,
      },
      update: {
        passwordHash,
        name: seedUser.name,
        initials: seedUser.initials,
        title: seedUser.title,
        isActive: true,
        primaryTeamId: seedUser.teamSlug ? team.id : null,
      },
    });

    const roleId = roleIds.get(seedUser.roleSlug);
    if (roleId) {
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({ data: { userId: user.id, roleId } });
    }

    if (seedUser.teamSlug) {
      await prisma.teamMember.upsert({
        where: {
          teamId_userId: { teamId: team.id, userId: user.id },
        },
        create: {
          teamId: team.id,
          userId: user.id,
          isLead: seedUser.isTeamLead,
        },
        update: { isLead: seedUser.isTeamLead },
      });
    }

    userIds.set(seedUser.email, user.id);
  }

  await backfillLeadOwnersForTenant(tenant.id);

  // Demo share: primeiro lead do comercial → parceiro
  const comercialId = userIds.get('comercial@insureflow.com');
  const parceiroId = userIds.get('parceiro@insureflow.com');
  if (comercialId && parceiroId) {
    let sampleLead = await prisma.lead.findFirst({
      where: { tenantId: tenant.id, ownerUserId: comercialId },
      orderBy: { createdAt: 'desc' },
    });
    if (!sampleLead) {
      sampleLead = await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          name: 'Lead demo compartilhado',
          email: 'demo.share@insureflow.local',
          source: 'seed-ownership',
          status: 'new',
          assignedTo: 'Bruno Comercial',
          ownerUserId: comercialId,
          ownerTeamId: team.id,
        },
      });
    }
    if (sampleLead) {
      await prisma.leadShare.upsert({
        where: {
          leadId_sharedWithUserId: {
            leadId: sampleLead.id,
            sharedWithUserId: parceiroId,
          },
        },
        create: {
          tenantId: tenant.id,
          leadId: sampleLead.id,
          sharedWithUserId: parceiroId,
          sharedByUserId: comercialId,
          permission: 'read',
        },
        update: { revokedAt: null },
      });
      console.log('[seed-ownership] LeadShare demo:', sampleLead.id);
    }
  }

  // HML/local: default shadow (não sobrescreve se já configurado)
  const settings =
    tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
      ? { ...(tenant.settings as Record<string, unknown>) }
      : {};
  if (!settings.ownershipEnforcement) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        settings: {
          ...settings,
          ownershipEnforcement: 'shadow',
        },
      },
    });
  }

  console.log(
    '[seed-ownership] OK — roles oficiais, equipe, usuários:',
    TEST_USERS.map((u) => u.email).join(', '),
  );
}

async function backfillLeadOwnersForTenant(tenantId: string) {
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, name: true, primaryTeamId: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const byName = new Map(users.map((u) => [u.name.toLowerCase(), u]));

  const leads = await prisma.lead.findMany({
    where: { tenantId, ownerUserId: null },
    select: { id: true, assignedTo: true },
  });

  let updated = 0;
  for (const lead of leads) {
    const raw = lead.assignedTo?.trim();
    if (!raw) continue;

    const owner =
      byId.get(raw) ??
      byEmail.get(raw.toLowerCase()) ??
      byName.get(raw.toLowerCase());
    if (!owner) continue;

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ownerUserId: owner.id,
        ownerTeamId: owner.primaryTeamId,
      },
    });
    updated++;
  }

  if (updated > 0) {
    console.log(`[seed-ownership] backfill ownerUserId: ${updated} leads`);
  }
}
