/**
 * Smoke test pós-deploy DEV (Neon + Railway + Vercel).
 * Uso:
 *   set API_URL=https://xxx.up.railway.app
 *   set WEB_URL=https://xxx.vercel.app
 *   node scripts/dev-cloud-smoke.cjs
 */
const api = (process.env.API_URL || process.env.API_INTERNAL_URL || '').replace(/\/$/, '');
const web = (process.env.WEB_URL || '').replace(/\/$/, '');

if (!api) {
  console.error('[smoke] Defina API_URL ou API_INTERNAL_URL');
  process.exit(1);
}

async function get(path, opts = {}) {
  const url = `${api}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { url, status: res.status, body };
}

async function main() {
  const results = [];

  const health = await get('/api/v1/health');
  results.push({ name: 'GET /api/v1/health', ok: health.status === 200, ...health });

  const healthDb = await get('/api/v1/health/db');
  results.push({ name: 'GET /api/v1/health/db', ok: healthDb.status === 200, ...healthDb });

  const login = await get('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantSlug: 'insureflow',
      email: 'admin@insureflow.com',
      password: 'Admin@2026!',
    }),
  });
  results.push({
    name: 'POST /api/v1/auth/login',
    ok: login.status === 200 || login.status === 201,
    ...login,
  });

  if (web) {
    for (const path of ['/login', '/crm/clientes', '/crm/atividades']) {
      const res = await fetch(`${web}${path}`, { redirect: 'manual' });
      results.push({
        name: `GET ${path} (web)`,
        url: `${web}${path}`,
        ok: res.status >= 200 && res.status < 400,
        status: res.status,
      });
    }

    const corsProbe = await fetch(`${api}/api/v1/health`, {
      headers: { Origin: web },
    });
    const allowOrigin = corsProbe.headers.get('access-control-allow-origin');
    results.push({
      name: 'CORS (API reflects web origin)',
      url: `${api}/api/v1/health`,
      ok: allowOrigin === web,
      status: corsProbe.status,
      body: allowOrigin || '(missing)',
    });

    const bffLogin = await fetch(`${web}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantSlug: 'insureflow',
        email: 'admin@insureflow.com',
        password: 'Admin@2026!',
      }),
    });
    const setCookie = bffLogin.headers.getSetCookie?.() ?? [];
    results.push({
      name: 'POST /api/auth/login (BFF / SSR)',
      url: `${web}/api/auth/login`,
      ok: bffLogin.status === 200,
      status: bffLogin.status,
      body: setCookie.length > 0 ? 'session cookie set' : 'no cookie',
    });

    if (bffLogin.status === 200 && setCookie.length > 0) {
      const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
      const me = await fetch(`${web}/api/auth/me`, { headers: { Cookie: cookie } });
      results.push({
        name: 'GET /api/auth/me (JWT session)',
        url: `${web}/api/auth/me`,
        ok: me.status === 200,
        status: me.status,
      });
    }
  }

  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? 'OK' : 'FAIL';
    console.log(`[${mark}] ${r.name} → ${r.status} ${r.url || ''}`);
    if (!r.ok) failed++;
  }

  if (failed > 0) {
    console.error(`\n[smoke] ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('\n[smoke] All checks passed');
}

main().catch((err) => {
  console.error('[smoke] Error:', err.message);
  process.exit(1);
});
