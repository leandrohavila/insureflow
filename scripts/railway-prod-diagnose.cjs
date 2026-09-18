/**
 * Diagnóstico produção Railway + domínio customizado.
 *
 *   npm run prod:railway:diagnose
 *   CUSTOM_API_URL=https://api.corretoraavila.com.br
 *   RAILWAY_URL=https://insureflow-production-08c5.up.railway.app
 *
 * (Não usa API_URL — evita confundir com smoke quando API_URL aponta ao *.up.railway.app.)
 */
const https = require('https');
const dns = require('dns').promises;

const apiCustom = (
  process.env.CUSTOM_API_URL || 'https://api.corretoraavila.com.br'
).replace(/\/$/, '');
const apiRailway = (
  process.env.RAILWAY_URL || 'https://insureflow-production-08c5.up.railway.app'
).replace(/\/$/, '');
const host = new URL(apiCustom).hostname;
const txtHost = `_railway-verify.${host}`;

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
  const out = { host, txtHost };
  const resolvers = [undefined, '8.8.8.8', '1.1.1.1'];
  for (const server of resolvers) {
    const label = server ?? 'system';
    const opts = server ? { servers: [server] } : undefined;
    try {
      const cname = await dns.resolveCname(host, opts);
      out[`cname@${label}`] = cname;
      if (!out.cnameTarget && cname?.[0]) {
        out.cnameTarget = String(cname[0]).replace(/\.$/, '');
      }
    } catch (e) {
      out[`cname@${label}`] = e.code || e.message;
    }
    try {
      out[`a@${label}`] = await dns.resolve4(host, opts);
    } catch (e) {
      out[`a@${label}`] = e.code || e.message;
    }
    try {
      const txt = await dns.resolveTxt(txtHost, opts);
      out[`txt@${label}`] = txt;
      const flat = txt.flat().join('');
      out[`txtOk@${label}`] =
        flat.startsWith('railway-verify=') &&
        flat.length > 24 &&
        !flat.includes('railway-verify=...');
    } catch (e) {
      out[`txt@${label}`] = e.code || e.message;
      out[`txtOk@${label}`] = false;
    }
  }
  return out;
}

function printHttp(label, r) {
  if (r.error) {
    console.log(`[ERR] ${label} → ${r.error}`);
    return;
  }
  const fallback = r.headers['x-railway-fallback'];
  console.log(`[${r.status}] ${label}`);
  if (fallback) console.log('  X-Railway-Fallback:', fallback);
  if (r.status >= 400) {
    console.log('  body:', r.body.slice(0, 160));
  } else if (r.status === 200) {
    console.log('  body:', r.body.slice(0, 120));
  }
}

async function main() {
  console.log('=== Railway / API produção — diagnóstico ===\n');

  const dnsOut = await checkDns();
  console.log('DNS:', JSON.stringify(dnsOut, null, 2));

  const paths = ['/api/v1/health', '/api/v1/health/db'];
  console.log(`\n--- Custom: ${apiCustom} ---`);
  let customFallback = false;
  for (const p of paths) {
    const r = await fetchUrl(`${apiCustom}${p}`);
    printHttp(p, r);
    if (r.headers?.['x-railway-fallback']) customFallback = true;
  }

  console.log(`\n--- Railway default: ${apiRailway} ---`);
  let defaultOk = false;
  for (const p of paths) {
    const r = await fetchUrl(`${apiRailway}${p}`);
    printHttp(p, r);
    if (r.status === 200 && p === '/api/v1/health') defaultOk = true;
  }

  if (dnsOut.cnameTarget) {
    const cnameBase = `https://${dnsOut.cnameTarget}`;
    console.log(`\n--- CNAME target (edge Railway): ${cnameBase} ---`);
    const r = await fetchUrl(`${cnameBase}/api/v1/health`);
    printHttp('/api/v1/health', r);
    if (r.headers?.['x-railway-fallback']) {
      console.log(
        '  → O hostname do CNAME ainda não está ligado ao serviço (domínio custom não verificado/Active no painel).',
      );
    }
  }

  console.log('\n--- Interpretação ---');
  if (defaultOk && customFallback) {
    console.log(
      'DNS + TXT provavelmente OK, mas o bind Railway NÃO está ativo: X-Railway-Fallback no custom domain.',
    );
    console.log('Ação (painel, serviço API insureflow):');
    console.log('  1. Networking → Custom domains → api.corretoraavila.com.br → ✓ verde / Active');
    console.log('  2. Editar domínio → Target port = 4000 (PORT do container)');
    console.log('  3. Se ficar preso: Remove domain → aguarde 2 min → Add de novo → atualize CNAME/TXT se mudarem');
    console.log('  4. Redeploy após Active; validar sem header X-Railway-Fallback');
  } else if (!defaultOk) {
    console.log(
      'Default *.up.railway.app não retorna 200 — corrigir deploy (Start Command, PORT, migrate) antes do custom domain.',
    );
  } else if (defaultOk && !customFallback) {
    console.log('Custom domain OK — rode prod:domain:smoke.');
  }

  console.log(
    '\n503/502 no edge (sem JSON insureflow-api) ≠ bug de Host/CORS na app; tráfego não chega ao Nest enquanto Fallback=true.',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
