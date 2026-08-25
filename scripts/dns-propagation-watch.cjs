/**
 * Acompanha propagação DNS — corretoraavila.com.br
 *
 *   node scripts/dns-propagation-watch.cjs
 *   node scripts/dns-propagation-watch.cjs --interval 30 --rounds 10
 */
const dns = require('dns').promises;
const { spawnSync } = require('node:child_process');

const EXPECT = {
  apexA: '76.76.21.21',
  wwwCname: 'cname.vercel-dns.com',
  apiCname: 'p3h635d4.up.railway.app',
};

const HOSTS = {
  apex: 'corretoraavila.com.br',
  www: 'www.corretoraavila.com.br',
  api: 'api.corretoraavila.com.br',
  txt: '_railway-verify.api.corretoraavila.com.br',
};

const AUTH_NS = ['a.auto.dns.br', 'b.auto.dns.br'];

function parseArgs() {
  const args = process.argv.slice(2);
  let interval = 30;
  let rounds = 5;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--interval' && args[i + 1]) interval = parseInt(args[++i], 10);
    if (args[i] === '--rounds' && args[i + 1]) rounds = parseInt(args[++i], 10);
  }
  return { interval, rounds };
}

async function q(name, type, server) {
  const opts = server ? { servers: [server] } : undefined;
  try {
    return await dns.resolve(name, type, opts);
  } catch (e) {
    return { error: e.code || e.message };
  }
}

async function checkSet(label) {
  const apex = await q(HOSTS.apex, 'A', label === '8.8.8.8' ? '8.8.8.8' : undefined);
  const www = await q(HOSTS.www, 'CNAME', label === '8.8.8.8' ? '8.8.8.8' : undefined);
  const api = await q(HOSTS.api, 'CNAME', label === '8.8.8.8' ? '8.8.8.8' : undefined);
  const txt = await q(HOSTS.txt, 'TXT', label === '8.8.8.8' ? '8.8.8.8' : undefined);

  const apexOk = Array.isArray(apex) && apex.includes(EXPECT.apexA);
  const wwwOk =
    Array.isArray(www) &&
    www.some((c) => String(c).replace(/\.$/, '') === EXPECT.wwwCname);
  const apiOk =
    Array.isArray(api) &&
    api.some((c) => String(c).replace(/\.$/, '') === EXPECT.apiCname);
  const txtOk =
    Array.isArray(txt) &&
    txt.flat().some((t) => {
      const s = String(t);
      return (
        s.startsWith('railway-verify=') &&
        s.length > 24 &&
        !s.includes('railway-verify=...')
      );
    });

  return { apex, www, api, txt, apexOk, wwwOk, apiOk, txtOk, allOk: apexOk && wwwOk && apiOk && txtOk };
}

async function checkAuthoritative() {
  const results = {};
  for (const ns of AUTH_NS) {
    results[ns] = await checkSet(ns);
    results[ns].label = ns;
  }
  return results;
}

function printRound(n, pub, auth) {
  const ts = new Date().toISOString();
  console.log(`\n=== Round ${n} @ ${ts} ===`);
  console.log('[Google 8.8.8.8]');
  console.log(`  A @     ${pub.apexOk ? 'OK' : 'FAIL'} ${JSON.stringify(pub.apex)} (want ${EXPECT.apexA})`);
  console.log(`  CNAME www ${pub.wwwOk ? 'OK' : 'FAIL'} ${JSON.stringify(pub.www)}`);
  console.log(`  CNAME api ${pub.apiOk ? 'OK' : 'FAIL'} ${JSON.stringify(pub.api)}`);
  console.log(`  TXT     ${pub.txtOk ? 'OK' : 'FAIL'} ${JSON.stringify(pub.txt)}`);
  for (const ns of AUTH_NS) {
    const a = auth[ns];
    console.log(`[Auth ${ns}] all=${a.allOk ? 'OK' : 'FAIL'} apex=${a.apexOk} www=${a.wwwOk} api=${a.apiOk} txt=${a.txtOk}`);
  }
  return pub.allOk && Object.values(auth).every((a) => a.allOk);
}

async function probeHttps() {
  const base = 'https://api.corretoraavila.com.br';
  for (const p of ['/api/v1/health', '/api/v1/health/db', '/api/v1/health/redis']) {
    try {
      const res = await fetch(`${base}${p}`, { signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      console.log(`[HTTP] ${res.status} ${p} ${text.slice(0, 80)}`);
    } catch (e) {
      console.log(`[HTTP] FAIL ${p} ${e.message}`);
    }
  }
}

async function main() {
  const { interval, rounds } = parseArgs();
  console.log('DNS propagation watch — corretoraavila.com.br');
  console.log('Expected:', EXPECT);

  let propagated = false;
  for (let r = 1; r <= rounds; r++) {
    const pub = await checkSet('8.8.8.8');
    const auth = await checkAuthoritative();
    propagated = printRound(r, pub, auth);
    if (propagated) break;
    if (r < rounds) {
      console.log(`\nWaiting ${interval}s...`);
      await new Promise((res) => setTimeout(res, interval * 1000));
    }
  }

  if (propagated) {
    console.log('\n--- DNS OK — probing HTTPS ---');
    await probeHttps();
    console.log('\n--- Smoke (optional) ---');
    console.log(
      'API_URL=https://api.corretoraavila.com.br WEB_URL=https://corretoraavila.com.br npm run prod:domain:smoke',
    );
  } else {
    console.log('\n--- DNS ainda incompleto após', rounds, 'round(s) ---');
    console.log('Publique no Registro.br (zona DNS) e rode novamente com mais --rounds.');
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
