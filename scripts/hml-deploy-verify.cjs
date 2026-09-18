/**
 * Fase 8 — verificação pós-deploy HML (API + Web + CORS + login).
 *
 *   API_URL=https://<api-hml> WEB_URL=https://<web-hml> node scripts/hml-deploy-verify.cjs
 */
const api = (process.env.API_URL || '').replace(/\/$/, '');
const web = (process.env.WEB_URL || '').replace(/\/$/, '');

function fail(msg) {
  console.error('[FAIL]', msg);
  process.exitCode = 1;
}

function ok(msg) {
  console.log('[OK]', msg);
}

async function get(path, opts = {}) {
  const res = await fetch(`${api}${path}`, {
    ...opts,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  console.log('\n=== HML Deploy Verify ===\n');
  if (!api) {
    fail('Defina API_URL');
    return;
  }
  console.log('API:', api);
  console.log('WEB:', web || '(skip)\n');

  const health = await get('/api/v1/health');
  if (health.status === 404 && health.body?.message?.includes('not found')) {
    fail('Railway Application not found — redeploy branch feature/rbac-ownership-foundations');
    return;
  }
  if (health.status !== 200) {
    fail(`/health → ${health.status}`);
  } else {
    ok(`/health → 200`);
  }

  const healthDb = await get('/api/v1/health/db');
  if (healthDb.status === 200) ok(`/health/db → 200`);
  else fail(`/health/db → ${healthDb.status}`);

  const login = await get('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantSlug: 'insureflow',
      email: 'comercial@insureflow.com',
      password: 'Comercial@2026!',
    }),
  });
  if (login.status !== 200 && login.status !== 201) {
    fail(`login → ${login.status}`);
  } else {
    const scope = login.body?.user?.dataScope;
    if (scope === 'own') ok(`login comercial dataScope=own`);
    else fail(`login sem dataScope Sprint 2 (got ${scope}) — branch antiga?`);
  }

  if (web) {
    const loginPage = await fetch(`${web}/login`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    if (loginPage.status === 404) {
      fail('Vercel DEPLOYMENT_NOT_FOUND — deploy branch HML');
    } else if (loginPage.status >= 200 && loginPage.status < 400) {
      ok(`WEB /login → ${loginPage.status}`);
    } else {
      fail(`WEB /login → ${loginPage.status}`);
    }

    const cors = await fetch(`${api}/api/v1/health`, {
      headers: { Origin: web },
      signal: AbortSignal.timeout(20000),
    });
    const allow = cors.headers.get('access-control-allow-origin');
    if (allow === web) ok(`CORS allow-origin=${web}`);
    else fail(`CORS missing/wrong (got ${allow})`);

    const bff = await fetch(`${web}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantSlug: 'insureflow',
        email: 'comercial@insureflow.com',
        password: 'Comercial@2026!',
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (bff.status === 200) ok('BFF POST /api/auth/login → 200');
    else fail(`BFF login → ${bff.status}`);

    const cookies = bff.headers.getSetCookie?.() ?? [];
    if (cookies.length > 0) {
      const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
      const me = await fetch(`${web}/api/auth/me`, {
        headers: { Cookie: cookie },
        signal: AbortSignal.timeout(20000),
      });
      const meBody = await me.json().catch(() => ({}));
      if (me.status === 200 && meBody.dataScope === 'own') {
        ok('BFF /api/auth/me dataScope=own');
      } else {
        fail(`BFF /api/auth/me → ${me.status} dataScope=${meBody.dataScope}`);
      }
    }
  }

  console.log('\nPróximo: npm run hml:sprint2:validate');
  if (process.exitCode) console.log('\nCorrija deploy/vars antes do browser checklist.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
