/**
 * Backfill assignedTo (texto) → ownerUserId / ownerTeamId
 *
 * Uso local/HML:
 *   APP_ENV=development npm run hml:sprint2:db backfill-dry
 *
 * NÃO rodar em produção sem revisão do relatório dry-run.
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
const execute = process.argv.includes('--execute');

type MatchKind = 'userId' | 'email' | 'name' | 'none' | 'ambiguous';

async function resolveOwner(
  tenantId: string,
  assignedTo: string | null,
  usersById: Map<string, { id: string; primaryTeamId: string | null }>,
  usersByEmail: Map<string, { id: string; primaryTeamId: string | null }>,
  usersByName: Map<string, { id: string; primaryTeamId: string | null }>,
): Promise<{ userId: string | null; teamId: string | null; kind: MatchKind }> {
  const raw = assignedTo?.trim();
  if (!raw) return { userId: null, teamId: null, kind: 'none' };

  if (usersById.has(raw)) {
    const u = usersById.get(raw)!;
    return { userId: u.id, teamId: u.primaryTeamId, kind: 'userId' };
  }

  const emailKey = raw.toLowerCase();
  if (usersByEmail.has(emailKey)) {
    const u = usersByEmail.get(emailKey)!;
    return { userId: u.id, teamId: u.primaryTeamId, kind: 'email' };
  }

  const nameKey = raw.toLowerCase();
  if (usersByName.has(nameKey)) {
    const u = usersByName.get(nameKey)!;
    return { userId: u.id, teamId: u.primaryTeamId, kind: 'name' };
  }

  return { userId: null, teamId: null, kind: 'none' };
}

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, slug: true } });

  const report = {
    mode: execute ? 'execute' : 'dry-run',
    tenants: [] as Array<{
      slug: string;
      total: number;
      updated: number;
      alreadySet: number;
      unmatched: number;
      orphaned: number;
    }>,
  };

  for (const tenant of tenants) {
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, email: true, name: true, primaryTeamId: true },
    });

    const usersById = new Map(users.map((u) => [u.id, u]));
    const usersByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
    const usersByName = new Map(users.map((u) => [u.name.toLowerCase(), u]));

    const leads = await prisma.lead.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        assignedTo: true,
        ownerUserId: true,
        ownerTeamId: true,
      },
    });

    let updated = 0;
    let alreadySet = 0;
    let unmatched = 0;
    let orphaned = 0;

    for (const lead of leads) {
      if (lead.ownerUserId) {
        alreadySet++;
        continue;
      }

      const resolved = await resolveOwner(
        tenant.id,
        lead.assignedTo,
        usersById,
        usersByEmail,
        usersByName,
      );

      if (resolved.kind === 'none' && !lead.assignedTo?.trim()) {
        orphaned++;
        continue;
      }

      if (!resolved.userId) {
        unmatched++;
        console.warn(
          `[backfill] unmatched tenant=${tenant.slug} lead=${lead.id} assignedTo=${lead.assignedTo}`,
        );
        continue;
      }

      if (execute) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            ownerUserId: resolved.userId,
            ownerTeamId: resolved.teamId,
          },
        });
      }
      updated++;
    }

    report.tenants.push({
      slug: tenant.slug,
      total: leads.length,
      updated,
      alreadySet,
      unmatched,
      orphaned,
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
