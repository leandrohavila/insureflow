/**
 * Diagnóstico produção Railway + domínio customizado.
 *
 *   node scripts/railway-prod-diagnose.cjs
 *   API_URL=https://api.corretoraavila.com.br RAILWAY_URL=https://xxx.up.railway.app node scripts/railway-prod-diagnose.cjs
 */
const https = require('https');
const dns = require('dns').promises;

const apiCustom =
  (process.env.API_URL || 'https://api.corretoraavila.com.br').replace(/\/$/, '');
const apiRailway = process.env.RAILWAY_URL?.replace(/\/$/, '');
const host = new URL(apiCustom).hostname;

function fetchUrl(url, opts = {}) {
  const timeout = opts.timeout ?? 15000;
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { timeout, headers: opts.headers },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          resolve({
            url,
            status: res.statusCode,
            headers: res.headers,
            body: body.slice(0, 500),
          });
        });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'timeout' });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
  });
}

async function checkDns() {
  const out = { host };
  const resolvers = [undefined, '8.8.8.8', '1.1.1.1'];
  for (const server of resolvers) {
    const label = server ?? 'system';
    const opts = server ? { servers: [server] } : undefined;
    try {
      const cname = await dns.resolveCname(host, opts);
      out[`cname@${label}`] = cname;
    } catch (e) {
      out[`cname@${label}`] = e.code || e.message;
    }
    try {
      out[`a@${label}`] = await dns.resolve4(host, opts);
    } catch (e) {
      out[`a@${label}`] = e.code || e.message;
    }
  }
  return out;
}

async function main() {
  console.log('=== Railway / API produção — diagnóstico ===\n');
  console.log('DNS:', await checkDns());

  const paths = ['/api/v1/health', '/api/v1/health/db'];
  for (const base of [apiCustom, apiRailway].filter(Boolean)) {
    console.log(`\n--- ${base} ---`);
    for (const p of paths) {
      const r = await fetchUrl(`${base}${p}`);
      if (r.error) {
        console.log(`[ERR] ${p} → ${r.error}`);
      } else {
        console.log(`[${r.status}] ${p}`);
        if (r.status >= 500) {
          console.log('  server:', r.headers.server);
          console.log('  body:', r.body.slice(0, 200));
        } else if (r.status === 200) {
          console.log('  body:', r.body.slice(0, 120));
        }
      }
    }
  }

  console.log('\n--- Interpretação 503 ---');
  console.log(
    '503 no edge Railway (sem JSON insureflow-api) = réplica não saudável: start command, PORT, crash no boot, migrate falhou, ou domínio no serviço errado.',
  );
  console.log(
    '200 com { status: "ok", service: "insureflow-api" } = app OK; 503 em /health/db só = DATABASE_URL.',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
