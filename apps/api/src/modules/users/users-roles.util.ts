import { DataScope, PrismaClient } from '@prisma/client';

/** Perfis operacionais go-live — upsert idempotente por tenant. */
export const GO_LIVE_ROLE_SLUGS = [
  'super_admin',
  'admin',
  'corretor',
  'corretor_imobiliario',
  'operador',
] as const;

export type GoLiveRoleSlug = (typeof GO_LIVE_ROLE_SLUGS)[number];

type RoleSeedDef = {
  slug: GoLiveRoleSlug;
  name: string;
  description: string;
  defaultDataScope: DataScope;
  permissions: string[];
};

const ALL_MANAGE_KEYS = [
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
  'policies:manage',
  'claims:view',
  'claims:manage',
  'whatsapp:view',
  'whatsapp:manage',
  'automation:view',
  'automation:manage',
  'settings:view',
  'settings:manage',
  'business-units:view-all',
  'business-units:manage',
  'properties:view',
  'properties:manage',
  'users:manage',
  'tenants:manage',
  'audit:view',
] as const;

const GO_LIVE_ROLE_DEFS: RoleSeedDef[] = [
  {
    slug: 'super_admin',
    name: 'Super Admin',
    description: 'Acesso total à plataforma e tenant',
    defaultDataScope: 'tenant',
    permissions: [...ALL_MANAGE_KEYS],
  },
  {
    slug: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao tenant Grupo Ávila',
    defaultDataScope: 'tenant',
    permissions: [...ALL_MANAGE_KEYS.filter((k) => k !== 'tenants:manage')],
  },
  {
    slug: 'corretor',
    name: 'Corretor',
    description: 'Carteira comercial — Corretora Ávila (seguros)',
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
    slug: 'corretor_imobiliario',
    name: 'Corretor Imobiliário',
    description: 'Operação imobiliária — Ávila Imóveis',
    defaultDataScope: 'own',
    permissions: [
      'dashboard:view',
      'properties:view',
      'properties:manage',
      'leads:view',
      'leads:manage',
      'settings:view',
    ],
  },
  {
    slug: 'operador',
    name: 'Operador',
    description: 'Pós-venda, apólices e operação',
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
];

export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export async function ensureGoLiveRoles(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const permRows = await prisma.permission.findMany({
    select: { id: true, key: true },
  });
  const permByKey = Object.fromEntries(permRows.map((p) => [p.key, p.id]));

  for (const def of GO_LIVE_ROLE_DEFS) {
    const role = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId, slug: def.slug } },
      create: {
        tenantId,
        slug: def.slug,
        name: def.name,
        description: def.description,
        isSystem: true,
        defaultDataScope: def.defaultDataScope,
      },
      update: {
        name: def.name,
        description: def.description,
        defaultDataScope: def.defaultDataScope,
        isSystem: true,
      },
    });

    for (const key of def.permissions) {
      const permissionId = permByKey[key];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId },
        },
        create: { roleId: role.id, permissionId },
        update: {},
      });
    }
  }
}

export function isGoLiveAssignableRole(slug: string): boolean {
  return (GO_LIVE_ROLE_SLUGS as readonly string[]).includes(slug);
}
