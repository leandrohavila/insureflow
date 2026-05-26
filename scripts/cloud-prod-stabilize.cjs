/**
 * Diagnóstico produção — Railway API, health, Redis, auth (sem HML).
 *
 *   API_URL=https://insureflow-production-08c5.up.railway.app node scripts/cloud-prod-stabilize.cjs
 *   WEB_URL=https://corretoraavila.com.br  (opcional, quando DNS OK)
 */
const api = (process.env.API_URL || '').replace(/\/$/, '');
const web = (process.env.WEB_URL || '').replace(/\/$/, '');
const prodEmail = process.env.PROD_ADMIN_EMAIL || 'leandro@corretoraavila.com.br';
const prodPassword = process.env.PROD_ADMIN_PASSWORD || '';

if (!api) {
  console.error('[stabilize] Defina API_URL (Railway *.up.railway.app ou api.corretoraavila.com.br)');
  process.exit(1);
}

async function get(path, opts = {}) {
  const url = `${api}${path}`;
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 300);
  }
  return { url, status: res.status, body, headers: res.headers };
}

function line(ok, name, detail) {
  console.log(`${ok ? '[OK]' : '[FAIL]'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('=== InsureFlow — estabilização produção ===\n');
  console.log('API_URL:', api);
  if (web) console.log('WEB_URL:', web);

  const report = {
    railway: { api },
    checks: [],
  };

  for (const [path, name] of [
    ['/api/v1/health', 'Liveness'],
    ['/api/v1/health/db', 'Neon / Prisma'],
    ['/api/v1/health/redis', 'Redis / BullMQ'],
  ]) {
    try {
      const r = await get(path);
      const ok = r.status === 200;
      line(ok, name, `${r.status}`);
      if (!ok && r.body) console.log('       ', JSON.stringify(r.body));
      report.checks.push({ name, ok, status: r.status });
    } catch (e) {
      line(false, name, e.message);
      report.checks.push({ name, ok: false, error: e.message });
    }
  }

  if (prodPassword) {
    try {
      const login = await get('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: 'insureflow',
          email: prodEmail,
          password: prodPassword,
        }),
      });
      const ok = login.status === 200 || login.status === 201;
      line(ok, `Login API (${prodEmail})`, `${login.status}`);
      report.checks.push({ name: 'login-api', ok, status: login.status });
    } catch (e) {
      line(false, 'Login API', e.message);
    }
  } else {
    console.log('\n[SKIP] Login prod — defina PROD_ADMIN_PASSWORD após seed-prod-admin');
  }

  if (web) {
    try {
      const cors = await fetch(`${api}/api/v1/health`, {
        headers: { Origin: web },
        signal: AbortSignal.timeout(15000),
      });
      const allow = cors.headers.get('access-control-allow-origin');
      line(allow === web, 'CORS', allow || '(missing)');
    } catch (e) {
      line(false, 'CORS / WEB', e.message);
    }
  }

  console.log('\n--- Pendências típicas ---');
  console.log('- Railway REDIS_URL: use referência ${{Redis.REDIS_URL}}, não 127.0.0.1');
  console.log('- DNS corretoraavila: registros A/CNAME/TXT no Registro.br');
  console.log('- Admin prod: node scripts/seed-prod-admin.cjs (Neon prod DATABASE_URL)');
  console.log('- Vercel: API_INTERNAL_URL + AUTH_SECRET + redeploy');

  const failed = report.checks.filter((c) => !c.ok).length;
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
