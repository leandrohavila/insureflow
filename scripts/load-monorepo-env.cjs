/**
 * Carrega variáveis do monorepo para scripts operacionais.
 * Com APP_ENV=development, não aplica .env.local (evita sobrescrever Neon dev).
 */
const fs = require('node:fs');
const path = require('node:path');

function loadMonorepoEnv(rootDir = path.resolve(__dirname, '..')) {
  const appEnv = process.env.APP_ENV || 'development';
  const files =
    appEnv === 'local'
      ? ['.env', '.env.local']
      : ['.env', `.env.${appEnv}`];

  for (const file of files) {
    const envPath = path.join(rootDir, file);
    if (!fs.existsSync(envPath)) continue;
    require('dotenv').config({ path: envPath, override: true });
  }

  if (process.env.DATABASE_URL_DIRECT) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
  }

  return {
    appEnv,
    databaseHost: (() => {
      try {
        return new URL(process.env.DATABASE_URL || '').host;
      } catch {
        return '(unset)';
      }
    })(),
  };
}

module.exports = { loadMonorepoEnv };
