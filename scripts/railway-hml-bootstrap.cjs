/**
 * Configura variáveis do serviço insureflow-api-hml (ambiente hml) a partir de .env.development.
 * Uso: node scripts/railway-hml-bootstrap.cjs [WEB_HML_URL]
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { loadMonorepoEnv } = require('./load-monorepo-env.cjs');

const root = path.resolve(__dirname, '..');
const webUrl = (process.argv[2] || '').replace(/\/$/, '');
const service = 'insureflow-api-hml';
const environment = 'hml';

loadMonorepoEnv(root);

const pairs = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_DAYS: process.env.JWT_REFRESH_DAYS || '7',
  OWNERSHIP_ENFORCEMENT: 'shadow',
  NODE_ENV: 'production',
  PORT: '4000',
  THROTTLE_TTL: process.env.THROTTLE_TTL || '60',
  THROTTLE_LIMIT: process.env.THROTTLE_LIMIT || '100',
  REDIS_URL: '${{Redis.REDIS_URL}}',
};

if (webUrl) {
  pairs.CORS_ORIGIN = `${webUrl},http://localhost:3000`;
} else if (process.env.CORS_ORIGIN) {
  pairs.CORS_ORIGIN = process.env.CORS_ORIGIN;
}

for (const [key, value] of Object.entries(pairs)) {
  if (!value) {
    console.warn(`[skip] ${key} vazio`);
    continue;
  }
  console.log(`[set] ${key}`);
  const res = spawnSync(
    'npx',
    [
      '-y',
      '@railway/cli',
      'variables',
      'set',
      `${key}=${value}`,
      '--service',
      service,
      '--environment',
      environment,
    ],
    { cwd: root, stdio: 'inherit', shell: true },
  );
  if (res.status !== 0) process.exit(res.status ?? 1);
}

console.log('[OK] Railway HML variables set');
