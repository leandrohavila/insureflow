const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const policyIdColumn = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'policyId'
    `;
    const policiesTable = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'policies'
    `;
    const activities = await prisma.activity.findMany({
      take: 2,
      include: {
        performedBy: { select: { id: true, name: true, initials: true } },
      },
      orderBy: [{ occurredAt: 'desc' }],
    });

    console.log(
      JSON.stringify(
        {
          policyIdColumn,
          policiesTable,
          activitiesQueryOk: true,
          activityCount: activities.length,
          sample: activities.map((row) => ({
            id: row.id,
            policyId: row.policyId,
            operationalEventKind: row.operationalEventKind,
          })),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        { ok: false, code: error.code, message: error.message },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
