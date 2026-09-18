const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const [total, sample] = await Promise.all([
      prisma.activity.count(),
      prisma.activity.findMany({
        take: 3,
        include: {
          performedBy: { select: { id: true, name: true, initials: true } },
        },
        orderBy: [{ occurredAt: 'desc' }],
      }),
    ]);
    console.log(JSON.stringify({ ok: true, total, samplePolicyIds: sample.map((a) => a.policyId) }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, code: error.code, message: error.message }, null, 2));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
