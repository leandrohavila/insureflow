import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const pkgRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(pkgRoot, '../..');

config({ path: path.join(monorepoRoot, '.env') });
config({ path: path.join(monorepoRoot, 'apps/api/.env'), override: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --project tsconfig.json prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
