/**
 * Seed mínima pós-limpeza demo (tenant.settings pipeline padrão).
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.production');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i);
    const val = t.slice(i + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(envPath);

if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_DIRECT) {
  console.error('[prod-seed-clean] Defina DATABASE_URL em .env.production');
  process.exit(1);
}

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_DIRECT) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
}

const dbPkg = path.join(root, 'packages/database');
const r = spawnSync(
  'npx',
  ['ts-node', '--project', 'tsconfig.json', 'prisma/seed-prod-clean.ts'],
  { cwd: dbPkg, stdio: 'inherit', shell: true, env: process.env },
);
process.exit(r.status ?? 1);
