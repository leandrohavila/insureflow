/**
 * ENV-001 — Valida ambiente de desenvolvimento local.
 *
 *   node scripts/check-local-runtime.cjs
 *
 * Garante:
 * - API_INTERNAL_URL aponta para localhost:4000
 * - Container Docker insureflow-api NÃO está na porta 4000
 * - GET /api/v1/health/runtime retorna runtime=local
 * - Web responde em :3000
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const API_BASE = 'http://localhost:4000';
const WEB_BASE = 'http://localhost:3000';

function fileHasKeys(filePath, keys) {
  if (!fs.existsSync(filePath)) return { exists: false, missing: keys, text: '' };
  const text = fs.readFileSync(filePath, 'utf8');
  const missing = keys.filter((k) => !new RegExp(`^${k}=`, 'm').test(text));
  return { exists: true, missing, text };
}

function readEnvValue(text, key) {
  const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : undefined;
}

async function probeJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, error: err.message, body: null };
  }
}

function dockerApiRunning() {
  const result = spawnSync(
    'docker',
    ['ps', '--filter', 'name=insureflow-api', '--format', '{{.Names}}'],
    { encoding: 'utf8', shell: true },
  );
  if (result.status !== 0) return false;
  return result.stdout.trim().includes('insureflow-api');
}

function countPort4000Listeners() {
  if (process.platform === 'win32') {
    const result = spawnSync('netstat', ['-ano'], { encoding: 'utf8', shell: true });
    if (result.status !== 0) return { count: -1, pids: [] };
    const lines = result.stdout.split('\n').filter((line) => line.includes(':4000') && line.includes('LISTENING'));
    const pids = [...new Set(lines.map((line) => line.trim().split(/\s+/).pop()).filter(Boolean))];
    return { count: pids.length, pids };
  }

  const result = spawnSync('lsof', ['-i', ':4000', '-sTCP:LISTEN'], { encoding: 'utf8' });
  if (result.status !== 0) return { count: 0, pids: [] };
  const pids = [...new Set(result.stdout.split('\n').slice(1).map((l) => l.split(/\s+/)[1]).filter(Boolean))];
  return { count: pids.length, pids };
}

async function main() {
  let failed = 0;

  console.log('=== ENV-001 — Validação do ambiente de desenvolvimento ===\n');

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

  console.log('--- 1. Arquivos de ambiente ---');
  if (!rootEnv.exists) {
    console.log('[FAIL] .env.local ausente — copie: cp .env.local.example .env.local');
    failed++;
  } else if (rootEnv.missing.length) {
    console.log(`[FAIL] .env.local faltando: ${rootEnv.missing.join(', ')}`);
    failed++;
  } else {
    console.log('[OK] .env.local com variáveis essenciais');
  }

  const apiInternalUrl = rootEnv.text ? readEnvValue(rootEnv.text, 'API_INTERNAL_URL') : undefined;
  console.log('\n--- 2. API_INTERNAL_URL ---');
  if (!apiInternalUrl) {
    console.log('[FAIL] API_INTERNAL_URL não definido em .env.local');
    failed++;
  } else if (!/^https?:\/\/(localhost|127\.0\.0\.1):4000\/?$/i.test(apiInternalUrl)) {
    console.log(`[FAIL] API_INTERNAL_URL=${apiInternalUrl} — deve apontar para http://localhost:4000`);
    failed++;
  } else {
    console.log(`[OK] API_INTERNAL_URL=${apiInternalUrl}`);
  }

  console.log('\n--- 3. Docker insureflow-api (deve estar parado) ---');
  if (dockerApiRunning()) {
    console.log('[FAIL] Container insureflow-api está rodando — pare com: docker stop insureflow-api');
    console.log('       Desenvolvimento local deve usar: npm run start:dev -w api');
    failed++;
  } else {
    console.log('[OK] Container insureflow-api não está ativo');
  }

  console.log('\n--- 4. Porta 4000 (um único processo Node local) ---');
  const listeners = countPort4000Listeners();
  if (listeners.count === -1) {
    console.log('[WARN] Não foi possível contar listeners na porta 4000');
  } else if (listeners.count === 0) {
    console.log('[FAIL] Nenhum processo ouvindo :4000 — inicie: npm run start:dev -w api');
    failed++;
  } else if (listeners.count > 1) {
    console.log(`[FAIL] ${listeners.count} processos na porta 4000 (PIDs: ${listeners.pids.join(', ')})`);
    failed++;
  } else {
    console.log(`[OK] Um processo ouvindo :4000 (PID ${listeners.pids[0]})`);
  }

  console.log('\n--- 5. API health + runtime ---');
  const health = await probeJson(`${API_BASE}/api/v1/health`);
  if (health.ok) {
    console.log(`[OK] GET /api/v1/health (${health.status})`);
  } else {
    console.log(`[FAIL] GET /api/v1/health (${health.error ?? health.status})`);
    failed++;
  }

  const runtime = await probeJson(`${API_BASE}/api/v1/health/runtime`);
  if (runtime.ok && runtime.body) {
    console.log(`[OK] GET /api/v1/health/runtime (${runtime.status})`);
    console.log(`     commit=${runtime.body.commit}`);
    console.log(`     pid=${runtime.body.pid} runtime=${runtime.body.runtime} env=${runtime.body.environment}`);
    if (runtime.body.runtime !== 'local') {
      console.log(`[FAIL] runtime=${runtime.body.runtime} — esperado "local" (código-fonte via start:dev)`);
      failed++;
    } else {
      console.log('[OK] runtime=local (API local, não Docker/Railway)');
    }
  } else {
    console.log(`[FAIL] GET /api/v1/health/runtime (${runtime.error ?? runtime.status})`);
    console.log('       Reinicie a API após pull: npm run start:dev -w api');
    failed++;
  }

  console.log('\n--- 6. Frontend (:3000) ---');
  try {
    const webRes = await fetch(`${WEB_BASE}/login`, { signal: AbortSignal.timeout(8000) });
    if (webRes.ok) {
      console.log(`[OK] Web → ${WEB_BASE}/login (${webRes.status})`);
    } else {
      console.log(`[FAIL] Web → ${WEB_BASE}/login (${webRes.status})`);
      failed++;
    }
  } catch (err) {
    console.log(`[FAIL] Web → ${WEB_BASE} (${err.message})`);
    failed++;
  }

  console.log('\n--- 7. Postgres (opcional) ---');
  const dockerPg = spawnSync('docker', ['ps', '--filter', 'name=insureflow-postgres', '--format', '{{.Status}}'], {
    encoding: 'utf8',
    shell: true,
  });
  if (dockerPg.status === 0 && dockerPg.stdout.trim()) {
    console.log(`[OK] Postgres container: ${dockerPg.stdout.trim()}`);
  } else {
    console.log('[WARN] Container insureflow-postgres não encontrado (docker compose up -d postgres redis)');
  }

  if (failed > 0) {
    console.error(`\n[ENV-001] ${failed} problema(s). Corrija antes de desenvolver.`);
    process.exit(1);
  }

  console.log('\n[ENV-001] Ambiente validado — desenvolvimento usa código-fonte local.');
}

main();
