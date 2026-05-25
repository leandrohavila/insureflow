/**
 * Diagnóstico rápido antes do login local.
 *   node scripts/check-local-runtime.cjs
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function fileHasKeys(filePath, keys) {
  if (!fs.existsSync(filePath)) return { exists: false, missing: keys };
  const text = fs.readFileSync(filePath, 'utf8');
  const missing = keys.filter((k) => !new RegExp(`^${k}=`, 'm').test(text));
  return { exists: true, missing };
}

async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  let failed = 0;

  const rootEnv = fileHasKeys(path.join(root, '.env.local'), [
    'DATABASE_URL',
    'JWT_SECRET',
    'AUTH_SECRET',
    'API_INTERNAL_URL',
  ]);
  const apiEnv = fileHasKeys(path.join(root, 'apps/api/.env'), [
    'DATABASE_URL',
    'JWT_SECRET',
  ]);

  console.log('--- Arquivos de ambiente ---');
  if (!rootEnv.exists) {
    console.log('[WARN] .env.local ausente — copie: cp .env.local.example .env.local');
    failed++;
  } else if (rootEnv.missing.length) {
    console.log(`[WARN] .env.local faltando: ${rootEnv.missing.join(', ')}`);
  } else {
    console.log('[OK] .env.local com variáveis essenciais');
  }

  if (!apiEnv.exists) {
    console.log('[WARN] apps/api/.env ausente — copie apps/api/.env.example');
    failed++;
  } else if (apiEnv.missing.length) {
    console.log(`[WARN] apps/api/.env faltando: ${apiEnv.missing.join(', ')}`);
  } else {
    console.log('[OK] apps/api/.env com variáveis essenciais');
  }

  console.log('\n--- Serviços HTTP ---');
  for (const [name, url] of [
    ['API health', 'http://localhost:4000/api/v1/health'],
    ['API health/db', 'http://localhost:4000/api/v1/health/db'],
    ['Web', 'http://localhost:3000/login'],
  ]) {
    const r = await probe(url);
    if (r.ok) {
      console.log(`[OK] ${name} → ${url} (${r.status})`);
    } else {
      console.log(`[FAIL] ${name} → ${url} (${r.error ?? r.status})`);
      failed++;
    }
  }

  console.log('\n--- Docker (opcional) ---');
  const docker = spawnSync('docker', ['ps', '--filter', 'name=insureflow-postgres', '--format', '{{.Status}}'], {
    encoding: 'utf8',
    shell: true,
  });
  if (docker.status === 0 && docker.stdout.trim()) {
    console.log(`[OK] Postgres container: ${docker.stdout.trim()}`);
  } else {
    console.log('[WARN] Container insureflow-postgres não encontrado (docker compose up -d)');
  }

  if (failed > 0) {
    console.error(`\n[check-local-runtime] ${failed} problema(s). Rode: npm run dev (raiz) e npm run dev:local:smoke`);
    process.exit(1);
  }
  console.log('\n[check-local-runtime] Ambiente pronto para login.');
}

main();
