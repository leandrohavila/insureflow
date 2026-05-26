/**
 * Admin de produção — tenant insureflow.
 *
 * Uso (Neon prod, DATABASE_URL direct ou pooled com permissão de escrita):
 *   PROD_ADMIN_PASSWORD="..." npx ts-node --project tsconfig.json prisma/seed-prod-admin.ts
 *
 * Se PROD_ADMIN_PASSWORD omitido, gera senha temporária e imprime uma vez no stdout.
 */
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_SLUG = 'insureflow';
const ADMIN_EMAIL = 'leandro@corretoraavila.com.br';
const ADMIN_ROLE = 'admin';

function generateTempPassword(): string {
  return randomBytes(18).toString('base64url');
}

async function main() {
  const password = process.env.PROD_ADMIN_PASSWORD?.trim() || generateTempPassword();
  const generated = !process.env.PROD_ADMIN_PASSWORD?.trim();

  const tenant = await prisma.tenant.findUnique({
    where: { slug: TENANT_SLUG },
  });
  if (!tenant) {
    throw new Error(
      `Tenant "${TENANT_SLUG}" não existe. Rode o seed base (npm run db:seed) antes.`,
    );
  }

  const role = await prisma.role.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: ADMIN_ROLE } },
  });
  if (!role) {
    throw new Error(`Role "${ADMIN_ROLE}" não existe no tenant ${TENANT_SLUG}.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: ADMIN_EMAIL.toLowerCase() },
    },
    create: {
      tenantId: tenant.id,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      name: 'Leandro Avila',
      initials: 'LA',
      title: 'Administrador',
      isActive: true,
    },
    update: {
      passwordHash,
      name: 'Leandro Avila',
      initials: 'LA',
      title: 'Administrador',
      isActive: true,
    },
  });

  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({
    data: { userId: user.id, roleId: role.id },
  });

  console.log('--- Prod admin OK ---');
  console.log('tenant:', TENANT_SLUG);
  console.log('email:', ADMIN_EMAIL);
  console.log('role:', ADMIN_ROLE);
  if (generated) {
    console.log('password (temporária — guarde agora):', password);
  } else {
    console.log('password: (definida via PROD_ADMIN_PASSWORD)');
  }
  console.log('seed admin@insureflow.com permanece como fallback de teste.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
