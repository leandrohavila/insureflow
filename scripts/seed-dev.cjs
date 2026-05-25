process.env.SEED_DEV_DATA = '1';
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const dbPkg = path.resolve(__dirname, '../packages/database');
const result = spawnSync(
  'npx',
  ['ts-node', '--project', 'tsconfig.json', 'prisma/seed.ts'],
  { cwd: dbPkg, stdio: 'inherit', shell: true, env: process.env },
);
process.exit(result.status ?? 1);
