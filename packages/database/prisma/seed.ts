/**
 * Seed: permissões globais, tenant demo, roles e usuários oficiais de teste.
 *
 * Credenciais:
 * - admin@insureflow.com / Admin@2026!
 * - viewer@insureflow.com / Viewer@2026!
 * - sales@insureflow.com / Sales@2026!
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS: { key: string; description: string }[] = [
  { key: 'dashboard:view', description: 'Ver dashboard' },
  { key: 'crm:view', description: 'Ver CRM' },
  { key: 'crm:manage', description: 'Gerenciar CRM' },
  { key: 'clients:view', description: 'Ver clientes' },
  { key: 'clients:manage', description: 'Gerenciar clientes' },
  { key: 'leads:view', description: 'Ver leads' },
  { key: 'leads:manage', description: 'Gerenciar leads' },
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
  { key: 'users:manage', description: 'Gerenciar usuários' },
  { key: 'tenants:manage', description: 'Gerenciar tenant' },
  { key: 'audit:view', description: 'Ver auditoria' },
];

const ROLE_PERMISSIONS = {
  admin: PERMISSIONS.map((p) => p.key),
  viewer: PERMISSIONS.map((p) => p.key).filter((key) => key.endsWith(':view')),
  sales: ['crm:manage', 'leads:manage', 'clients:view'],
} as const;

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

  if (process.env.SEED_DEV_DATA === '1') {
    const { seedDevData } = await import('./seed-dev');
    await seedDevData();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
