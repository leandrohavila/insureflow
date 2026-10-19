/**
 * Teste de integração da agenda de renovação contra o PostgreSQL isolado.
 *
 * Pré-requisitos:
 * - Docker em execução.
 * - Contêiner insureflow-postgres-test, imagem postgres:16-alpine.
 * - Porta publicada somente em 127.0.0.1:5433.
 * - Banco insureflow_test e volume próprio, separado de insureflow_pg_data.
 * - Arquivo .env.test.local na raiz da worktree, ignorado pelo Git, com
 *   POSTGRES_USER=insureflow_test, POSTGRES_DB=insureflow_test e
 *   POSTGRES_PASSWORD. O host do arquivo é ignorado: a conexão é sempre
 *   127.0.0.1:5433.
 *
 * Subida do banco, sem reutilizar o PostgreSQL de desenvolvimento:
 *   docker run -d --name insureflow-postgres-test \
 *     -p 127.0.0.1:5433:5432 \
 *     --env-file .env.test.local \
 *     -v insureflow_pg_test_data:/var/lib/postgresql/data \
 *     postgres:16-alpine
 *
 * Execução, a partir de apps/api:
 *   npm run test:agenda-postgres
 *
 * Falha de conexão: o comando encerra antes do Jest se o arquivo estiver
 * ausente, se o destino não for 127.0.0.1:5433/insureflow_test, se a porta
 * não responder, ou se current_database() não for insureflow_test.
 * Este teste não faz parte de npm test.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const apiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(apiRoot, '../..');
const envPath = path.join(repoRoot, '.env.test.local');

function fail(message) {
  console.error(`[agenda-postgres] ${message}`);
  process.exit(1);
}

function redact(text) {
  return String(text || '').replace(/postgresql:\/\/\S+/gi, '[redacted-url]');
}

function loadTarget() {
  if (!fs.existsSync(envPath)) {
    fail(
      'Arquivo .env.test.local ausente na raiz da worktree. Ele deve ficar fora do Git e conter POSTGRES_USER, POSTGRES_PASSWORD e POSTGRES_DB.',
    );
  }
  const values = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    values[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  if (
    values.POSTGRES_USER !== 'insureflow_test' ||
    values.POSTGRES_DB !== 'insureflow_test' ||
    !values.POSTGRES_PASSWORD
  ) {
    fail(
      'Destino rejeitado. O teste exige usuário e banco insureflow_test em 127.0.0.1:5433.',
    );
  }
  const url = new URL('postgresql://127.0.0.1:5433/insureflow_test');
  url.username = values.POSTGRES_USER;
  url.password = values.POSTGRES_PASSWORD;
  url.searchParams.set('schema', 'public');
  const hostOk = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  if (!hostOk || url.port !== '5433' || url.pathname !== '/insureflow_test') {
    fail(
      'Destino rejeitado. Somente host local, porta 5433 e banco insureflow_test são aceitos.',
    );
  }
  return { url: url.toString(), password: values.POSTGRES_PASSWORD };
}

async function assertLiveDatabase(databaseUrl, password) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT current_database() AS db, current_user AS usr',
    );
    const row = rows[0];
    if (row?.db !== 'insureflow_test' || row?.usr !== 'insureflow_test') {
      fail(
        'A conexão respondeu com outro banco ou usuário. Nenhum teste foi iniciado.',
      );
    }
    console.log(
      '[agenda-postgres] conexão confirmada em 127.0.0.1:5433, banco insureflow_test, usuário insureflow_test',
    );
  } catch (error) {
    const detail = redact(
      error && error.message ? error.message : error,
    ).split(password).join('[redacted]');
    fail(
      `Não foi possível consultar 127.0.0.1:5433. Verifique se o contêiner insureflow-postgres-test está em execução. ${detail}`,
    );
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function main() {
  const target = loadTarget();
  await assertLiveDatabase(target.url, target.password);
  const jestBin = path.join(repoRoot, 'node_modules', 'jest', 'bin', 'jest.js');
  const child = spawnSync(
    process.execPath,
    [
      jestBin,
      '--config',
      path.join(apiRoot, 'package.json'),
      '--testRegex',
      'lead-expiry-agenda.postgres.integration.ts',
      '--testPathPatterns',
      'lead-expiry-agenda.postgres',
      '--runInBand',
      '--cache=false',
      '--no-coverage',
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );
  process.exit(child.status === null ? 1 : child.status);
}

main().catch((error) => {
  fail(redact(error && error.stack ? error.stack : error));
});
