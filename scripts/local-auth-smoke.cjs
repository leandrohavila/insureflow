/**
 * Smoke test auth local (API + BFF opcional).
 *
 *   node scripts/local-auth-smoke.cjs
 *   WEB_URL=http://localhost:3000 node scripts/local-auth-smoke.cjs
 */
const api = (process.env.API_URL || process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(
  /\/$/,
  '',
);
const web = (process.env.WEB_URL || '').replace(/\/$/, '');

const credentials = {
  email: 'admin@insureflow.com',
  password: 'Admin@2026!',
  tenantSlug: 'insureflow',
};

async function get(path, opts = {}) {
  const url = `${api}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 300);
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
    body: JSON.stringify(credentials),
  });
  const loginOk = login.status === 200 || login.status === 201;
  results.push({
    name: 'POST /api/v1/auth/login (admin)',
    ok: loginOk && Boolean(login.body?.accessToken),
    ...login,
  });

  if (web) {
    const bff = await fetch(`${web}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });
    const bffText = await bff.text();
    let bffBody;
    try {
      bffBody = JSON.parse(bffText);
    } catch {
      bffBody = bffText.slice(0, 200);
    }
    const setCookie = bff.headers.get('set-cookie') || '';
    results.push({
      name: 'POST /api/auth/login (Next BFF)',
      url: `${web}/api/auth/login`,
      ok: bff.status === 200 && setCookie.includes('insureflow-session'),
      status: bff.status,
      body: bffBody,
      hasSessionCookie: setCookie.includes('insureflow-session'),
    });
  }

  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? 'OK' : 'FAIL';
    console.log(`[${mark}] ${r.name} → ${r.status ?? '—'} ${r.url || ''}`);
    if (!r.ok) failed++;
  }

  if (failed > 0) {
    console.error(`\n[local-auth-smoke] ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('\n[local-auth-smoke] All checks passed');
}

main().catch((err) => {
  console.error('[local-auth-smoke]', err.message);
  process.exit(1);
});
