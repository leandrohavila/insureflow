/**
 * Sprint 2 — validação operacional HML (shadow mode).
 *
 * Uso:
 *   API_URL=https://<api-hml> node scripts/hml-sprint2-validation.cjs
 *   API_URL=... WEB_URL=https://<web-hml> node scripts/hml-sprint2-validation.cjs
 *
 * Opcional (grava relatório parcial):
 *   REPORT_OUT=docs/architecture/sprint-2-hml-validation-run.json node scripts/hml-sprint2-validation.cjs
 *
 * Requer branch deployada + seed personas + OWNERSHIP_ENFORCEMENT=shadow na API.
 */
const fs = require('node:fs');
const path = require('node:path');

const api = (process.env.API_URL || process.env.API_INTERNAL_URL || '')
  .replace(/\/$/, '');
const web = (process.env.WEB_URL || '').replace(/\/$/, '');
const tenantSlug = process.env.TENANT_SLUG || 'insureflow';

const PERSONAS = [
  {
    id: 'V4-admin',
    email: 'admin@insureflow.com',
    password: 'Admin@2026!',
    expectedScope: 'tenant',
    expectTeamIds: false,
    expectLeadsShare: false,
  },
  {
    id: 'V3-gerencia',
    email: 'gerencia@insureflow.com',
    password: 'Gerencia@2026!',
    expectedScope: 'team',
    expectTeamIds: true,
    expectLeadsShare: false,
  },
  {
    id: 'V2-comercial',
    email: 'comercial@insureflow.com',
    password: 'Comercial@2026!',
    expectedScope: 'own',
    expectTeamIds: false,
    expectLeadsShare: false,
  },
  {
    id: 'V1-parceiro',
    email: 'parceiro@insureflow.com',
    password: 'Parceiro@2026!',
    expectedScope: 'shared',
    expectTeamIds: false,
    expectLeadsShare: true,
  },
];

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const json = Buffer.from(part, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function request(method, urlPath, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${api}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text.slice(0, 300);
  }
  return { status: res.status, data };
}

function check(name, ok, detail, issues) {
  const line = { name, ok, detail };
  if (!ok) issues.push(line);
  return line;
}

async function validatePersona(persona, issues) {
  const lines = [];
  const login = await request('POST', '/api/v1/auth/login', {
    body: {
      tenantSlug,
      email: persona.email,
      password: persona.password,
    },
  });

  lines.push(
    check(
      `${persona.id} login`,
      login.status === 200 || login.status === 201,
      `status=${login.status}`,
      issues,
    ),
  );

  if (login.status !== 200 && login.status !== 201) {
    return { persona: persona.id, lines, loginError: login.data };
  }

  const accessToken = login.data?.accessToken;
  const user = login.data?.user ?? {};
  const jwt = accessToken ? decodeJwtPayload(accessToken) : null;

  const dataScope = user.dataScope ?? jwt?.dataScope;
  const teamIds = user.teamIds ?? jwt?.teamIds ?? [];

  lines.push(
    check(
      `${persona.id} dataScope`,
      dataScope === persona.expectedScope,
      `got=${dataScope} expected=${persona.expectedScope}`,
      issues,
    ),
  );

  if (persona.expectTeamIds) {
    lines.push(
      check(
        `${persona.id} teamIds`,
        Array.isArray(teamIds) && teamIds.length > 0,
        `teamIds=${JSON.stringify(teamIds)}`,
        issues,
      ),
    );
  }

  const me = await request('GET', '/api/v1/auth/me', { token: accessToken });
  lines.push(
    check(
      `${persona.id} GET /auth/me`,
      me.status === 200,
      `status=${me.status}`,
      issues,
    ),
  );

  const leads = await request('GET', '/api/v1/leads?limit=50', {
    token: accessToken,
  });
  const leadCount =
    leads.data?.meta?.total ?? leads.data?.data?.length ?? 'n/a';
  lines.push(
    check(
      `${persona.id} GET /leads`,
      leads.status === 200,
      `status=${leads.status} total=${leadCount}`,
      issues,
    ),
  );

  const noToken = await request('GET', '/api/v1/leads');
  lines.push(
    check(
      `${persona.id} GET /leads sem token (401)`,
      noToken.status === 401,
      `status=${noToken.status}`,
      issues,
    ),
  );

  const sampleId = leads.data?.data?.[0]?.id;
  if (sampleId) {
    const detail = await request('GET', `/api/v1/leads/${sampleId}`, {
      token: accessToken,
    });
    lines.push(
      check(
        `${persona.id} GET /leads/:id`,
        detail.status === 200,
        `id=${sampleId} status=${detail.status}`,
        issues,
      ),
    );
  }

  return {
    persona: persona.id,
    email: persona.email,
    dataScope,
    teamIds,
    roles: user.roles ?? jwt?.roles,
    permissions: user.permissions ?? jwt?.permissions,
    leadCount,
    lines,
  };
}

async function validateWebSession(issues) {
  if (!web) return null;
  const lines = [];
  const login = await fetch(`${web}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantSlug,
      email: 'comercial@insureflow.com',
      password: 'Comercial@2026!',
    }),
    signal: AbortSignal.timeout(20000),
  });
  const cookies = login.headers.getSetCookie?.() ?? [];
  lines.push(
    check(
      'WEB BFF login',
      login.status === 200,
      `status=${login.status}`,
      issues,
    ),
  );
  if (login.status !== 200 || cookies.length === 0) {
    return { lines };
  }
  const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
  const me = await fetch(`${web}/api/auth/me`, {
    headers: { Cookie: cookie },
    signal: AbortSignal.timeout(20000),
  });
  const body = await me.json().catch(() => ({}));
  lines.push(
    check(
      'WEB session dataScope',
      body.dataScope === 'own',
      `dataScope=${body.dataScope}`,
      issues,
    ),
  );
  return { lines, session: body };
}

async function main() {
  const startedAt = new Date().toISOString();
  const issues = [];

  if (!api) {
    console.error('[hml-sprint2] Defina API_URL (ex.: Railway HML)');
    process.exit(1);
  }

  console.log(`\n=== Sprint 2 HML validation ===\nAPI: ${api}\nWEB: ${web || '(skip)'}\n`);

  const health = await request('GET', '/api/v1/health');
  console.log('Health:', health.status, health.data?.status ?? health.data);

  if (health.status === 404) {
    console.error(
      '\n[FAIL] API não encontrada — faça deploy da branch feature/rbac-ownership-foundations no HML.',
    );
    process.exit(1);
  }

  const results = [];
  for (const persona of PERSONAS) {
    console.log(`\n--- ${persona.id} (${persona.email}) ---`);
    const r = await validatePersona(persona, issues);
    results.push(r);
    for (const line of r.lines ?? []) {
      console.log(line.ok ? '[OK]' : '[FAIL]', line.name, '—', line.detail);
    }
  }

  const webResult = await validateWebSession(issues);
  if (webResult?.lines) {
    console.log('\n--- Frontend BFF ---');
    for (const line of webResult.lines) {
      console.log(line.ok ? '[OK]' : '[FAIL]', line.name, '—', line.detail);
    }
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    api,
    web: web || null,
    tenantSlug,
    mode: 'shadow (expected — no API blocking)',
    personas: results,
    webSession: webResult?.session ?? null,
    issueCount: issues.length,
    issues,
    shadowLogHint:
      'Revise logs Railway: [ownership:shadow] — não capturados por este script.',
    nextSteps: [
      'Preencher docs/architecture/sprint-2-hml-validation-report.md',
      'Revisar backfill dry-run no banco HML',
      'NÃO ativar OWNERSHIP_ENFORCEMENT=on até sign-off',
    ],
  };

  const outPath =
    process.env.REPORT_OUT ||
    path.join(
      __dirname,
      '..',
      'docs',
      'architecture',
      'sprint-2-hml-validation-run.json',
    );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nRelatório JSON: ${outPath}`);
  console.log(`Issues: ${issues.length}`);

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
