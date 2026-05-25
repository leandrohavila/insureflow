/**
 * Aplica migrations no Neon DEV (somente migrate deploy, nunca reset).
 * Requer .env.development com DATABASE_URL_DIRECT (Neon direct).
 *
 *   cp .env.development.example .env.development
 *   node scripts/dev-cloud-migrate.cjs
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.development');

if (!fs.existsSync(envPath)) {
  console.error('[migrate] Crie .env.development a partir de .env.development.example');
  process.exit(1);
}

require('dotenv').config({ path: envPath });

const direct = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!direct) {
  console.error('[migrate] Defina DATABASE_URL_DIRECT (Neon direct) em .env.development');
  process.exit(1);
}

process.env.DATABASE_URL = direct;
process.env.APP_ENV = process.env.APP_ENV || 'development';

console.log('[migrate] prisma migrate deploy (direct URL)...');
const result = spawnSync('npm', ['run', 'db:deploy', '-w', '@repo/database'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
