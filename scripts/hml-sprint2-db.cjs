/**
 * Sprint 2 — operações de banco HML (migrate, seed, backfill).
 * NÃO usar com DATABASE_URL de produção.
 *
 * Uso:
 *   $env:DATABASE_URL = "<neon-hml-direct-or-pool>"
 *   node scripts/hml-sprint2-db.cjs migrate
 *   node scripts/hml-sprint2-db.cjs seed
 *   node scripts/hml-sprint2-db.cjs backfill-dry
 *   node scripts/hml-sprint2-db.cjs backfill-execute
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dbPkg = path.join(root, 'packages', 'database');
const { loadMonorepoEnv } = require('./load-monorepo-env.cjs');

const envInfo = loadMonorepoEnv(root);
console.log(`[hml-sprint2-db] APP_ENV=${envInfo.appEnv} DB host=${envInfo.databaseHost}`);

const cmd = process.argv[2];

function run(label, args, extraEnv = {}) {
  console.log(`\n=== ${label} ===\n`);
  const res = spawnSync('npx', args, {
    cwd: dbPkg,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (res.status !== 0) {
    console.error(`[FAIL] ${label}`);
    process.exit(res.status ?? 1);
  }
  console.log(`[OK] ${label}`);
}

function assertDatabaseUrl() {
  const url = process.env.DATABASE_URL || '';
  if (!url || url.includes('USER:PASSWORD') || url.includes('ep-XXXX')) {
    console.error(
      '[FAIL] Defina DATABASE_URL do HML (Neon). Não use URL de produção.',
    );
    process.exit(1);
  }
  if (/prod|production/i.test(url) && !process.env.ALLOW_PROD_DB) {
    console.error(
      '[FAIL] URL parece produção. Use banco HML ou ALLOW_PROD_DB=1 com cautela.',
    );
    process.exit(1);
  }
}

assertDatabaseUrl();

switch (cmd) {
  case 'migrate':
    run('prisma migrate deploy', [
      'prisma',
      'migrate',
      'deploy',
    ]);
    break;
  case 'seed':
    run('db seed', ['ts-node', '--project', 'tsconfig.json', 'prisma/seed.ts'], {
      SEED_DEV_DATA: process.env.SEED_DEV_DATA ?? '1',
      APP_ENV: process.env.APP_ENV || 'development',
    });
    break;
  case 'backfill-dry':
    run('backfill dry-run', [
      'ts-node',
      '--project',
      'tsconfig.json',
      'prisma/scripts/backfill-lead-ownership.ts',
    ]);
    break;
  case 'backfill-execute':
    console.warn('\n[WARN] Aplicando backfill em HML — confirme dry-run revisado.\n');
    run('backfill execute', [
      'ts-node',
      '--project',
      'tsconfig.json',
      'prisma/scripts/backfill-lead-ownership.ts',
      '--',
      '--execute',
    ]);
    break;
  default:
    console.log(`Uso: node scripts/hml-sprint2-db.cjs <migrate|seed|backfill-dry|backfill-execute>`);
    process.exit(1);
}
