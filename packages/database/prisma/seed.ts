/**
 * Seed: permissões globais, tenant demo, papéis e usuário admin.
 * Senha padrão: Admin@2026!
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

  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'admin' },
    },
    create: {
      tenantId: tenant.id,
      name: 'Administrador',
      slug: 'admin',
      description: 'Acesso total ao tenant',
      isSystem: true,
    },
    update: {},
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  for (const p of allPerms) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  const brokerPerms = [
    'dashboard:view',
    'crm:view',
    'crm:manage',
    'clients:view',
    'clients:manage',
    'leads:view',
    'leads:manage',
    'quotes:view',
    'quotes:manage',
    'settings:view',
  ];
  const brokerRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'broker' } },
    create: {
      tenantId: tenant.id,
      name: 'Corretor',
      slug: 'broker',
      isSystem: true,
    },
    update: {},
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: brokerRole.id } });
  for (const k of brokerPerms) {
    const id = permByKey[k];
    if (id)
      await prisma.rolePermission.create({
        data: { roleId: brokerRole.id, permissionId: id },
      });
  }

  const passwordHash = await bcrypt.hash('Admin@2026!', 10);
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'admin@insureflow.com' },
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@insureflow.com',
      passwordHash,
      name: 'Ana Costa',
      initials: 'AC',
      title: 'Head of Operations',
    },
    update: { passwordHash },
  });

  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({
    data: { userId: user.id, roleId: adminRole.id },
  });

  console.log('Seed OK — tenant:', tenant.slug, 'admin: admin@insureflow.com / Admin@2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
