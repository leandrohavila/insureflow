/**
 * Homologação DEV cloud — executa validações na ordem do runbook.
 * Requer .env.development preenchido e (após deploy) API_URL + WEB_URL.
 *
 *   node scripts/dev-cloud-homologation.cjs
 *   API_URL=https://xxx.up.railway.app WEB_URL=https://xxx.vercel.app node scripts/dev-cloud-homologation.cjs
 */
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.development');

const SHAS = ['f7cc6b8', 'eb6c1b3'];

function step(title) {
  console.log(`\n=== ${title} ===`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  process.exitCode = 1;
  return false;
}

function ok(msg) {
  console.log(`[OK] ${msg}`);
  return true;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i)] = t.slice(i + 1);
  }
  return out;
}

function fetchCiRuns() {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: 'api.github.com',
        path: '/repos/leandrohavila/insureflow/actions/runs?branch=develop&per_page=20',
        headers: { 'User-Agent': 'insureflow-homologation' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
  });
}

function hasRealDbUrl(url) {
  if (!url) return false;
  return !url.includes('ep-XXXX') && !url.includes('USER:PASSWORD');
}

async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  step('1. CI GitHub (develop)');
  try {
    const data = await fetchCiRuns();
    for (const sha of SHAS) {
      const run = data.workflow_runs?.find((w) => w.head_sha?.startsWith(sha));
      if (!run) {
        fail(`CI run não encontrado para ${sha}`);
        continue;
      }
      const label = `${sha.slice(0, 7)} → ${run.conclusion} (run #${run.run_number})`;
      if (run.conclusion === 'success') ok(label);
      else if (run.conclusion === 'cancelled' && sha.startsWith('f7cc6b8')) {
        console.log(
          `[WARN] ${label} — cancelado por push concorrente; reexecute em Actions ou use eb6c1b3 como baseline.`,
        );
      } else fail(label);
    }
  } catch (err) {
    fail(`CI API: ${err.message}`);
  }

  step('2–4. .env.development');
  if (!fs.existsSync(envPath)) {
    fail('Crie: cp .env.development.example .env.development');
  } else {
    ok('.env.development existe');
  }

  const env = loadEnvFile(envPath);
  const required = ['DATABASE_URL', 'DATABASE_URL_DIRECT', 'JWT_SECRET', 'AUTH_SECRET'];
  for (const key of required) {
    const val = env[key] || process.env[key];
    if (!val || val.includes('REPLACE_WITH')) {
      fail(`${key} não preenchido`);
    } else if (key.startsWith('DATABASE') && !hasRealDbUrl(val)) {
      fail(`${key} ainda é placeholder — provisione Neon insureflow-dev`);
    } else {
      ok(`${key} definido`);
    }
  }

  if (!hasRealDbUrl(env.DATABASE_URL_DIRECT || process.env.DATABASE_URL_DIRECT)) {
    console.log('\n[PENDENTE] Passos 5–10 após Neon + Railway + Vercel.');
    console.log('  npm run dev:cloud:migrate');
    console.log('  npm run dev:cloud:smoke  (com API_URL e WEB_URL)');
    return;
  }

  step('5. Migrations cloud');
  const migrate = spawnSync('npm', ['run', 'dev:cloud:migrate'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (migrate.status !== 0) {
    fail('dev:cloud:migrate');
    return;
  }
  ok('migrate deploy');

  const api =
    (process.env.API_URL || env.API_INTERNAL_URL || '').replace(/\/$/, '') ||
    '';
  const web = (process.env.WEB_URL || '').replace(/\/$/, '');

  if (!api) {
    console.log('\n[PENDENTE] Passos 6–8: deploy Railway/Vercel e defina API_URL.');
    return;
  }

  step('6. Railway health');
  for (const p of ['/api/v1/health', '/api/v1/health/db']) {
    const r = await probe(`${api}${p}`);
    if (r.ok) ok(`${p} → ${r.status}`);
    else fail(`${p} → ${r.error ?? r.status}`);
  }

  step('9. Smoke cloud');
  const smokeEnv = { ...process.env, API_URL: api, WEB_URL: web };
  const smoke = spawnSync('npm', ['run', 'dev:cloud:smoke'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: smokeEnv,
  });
  if (smoke.status !== 0) fail('dev:cloud:smoke');
  else ok('smoke cloud');

  step('10. Manual');
  console.log(
    'Checklist browser: login, /crm/negocios, registrar atividade, customer dialog, timeline, contatos/empresas/clientes, quick actions, mobile viewport.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
