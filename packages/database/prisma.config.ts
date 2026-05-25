import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const pkgRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(pkgRoot, '../..');
const appEnv = process.env.APP_ENV ?? 'local';

const envFiles = [
  path.join(monorepoRoot, '.env'),
  path.join(monorepoRoot, '.env.local'),
  path.join(monorepoRoot, `.env.${appEnv}`),
  path.join(monorepoRoot, 'apps/api/.env'),
];

for (const envFile of envFiles) {
  config({ path: envFile, override: true });
}

// Migrations usam conexão direct quando disponível (Neon pooling)
if (process.env.DATABASE_URL_DIRECT) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
}

/** Fallback para `prisma generate` em CI/Vercel (sem DB real). */
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/insureflow?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --project tsconfig.json prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
