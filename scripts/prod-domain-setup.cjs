/**
 * Plano e checklist de domínio produção — corretoraavila.com.br
 *
 *   npm run prod:domain:plan
 *   node scripts/prod-domain-setup.cjs --zone outro.com.br
 *
 * Smoke (após DNS + deploy):
 *   API_URL=https://api.corretoraavila.com.br WEB_URL=https://corretoraavila.com.br npm run prod:domain:smoke
 */
const { spawnSync } = require('node:child_process');
const path = require('path');

const DEFAULT_ZONE = 'corretoraavila.com.br';

function parseArgs() {
  const args = process.argv.slice(2);
  let zone = DEFAULT_ZONE;
  let smoke = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--zone' && args[i + 1]) {
      zone = args[++i];
    } else if (args[i] === '--smoke') {
      smoke = true;
    }
  }
  return { zone, smoke };
}

function section(title) {
  console.log(`\n=== ${title} ===\n`);
}

function printDnsPlan(zone) {
  section(`DNS — zona ${zone} (somente produção)`);
  console.log('Registro.br / zona DNS:');
  console.log('');
  console.log('  Tipo    Nome    Valor');
  console.log('  ----    ----    -----');
  console.log('  A       @       76.76.21.21   (confirmar no wizard Vercel Domains)');
  console.log('  CNAME   www     cname.vercel-dns.com');
  console.log('  CNAME   api     <TARGET exibido pelo Railway ao adicionar api.' + zone + '>');
  console.log('');
  section('Reservado homologação (NÃO criar ainda)');
  console.log('  CNAME   homolog   → Vercel (quando existir branch/projeto HML)');
  console.log('  CNAME   api-hml   → Railway (serviço HML)');
  console.log('');
  console.log('Ver runbook: docs/infra/custom-domain.md');
}

function printEnvPlan(zone) {
  const web = `https://${zone}`;
  const www = `https://www.${zone}`;
  const api = `https://api.${zone}`;
  section('Variáveis (produção)');
  console.log('Railway:');
  console.log(`  CORS_ORIGIN=${web},${www}`);
  console.log('');
  console.log('Vercel (apps/web):');
  console.log(`  API_INTERNAL_URL=${api}`);
  console.log('  AUTH_SECRET=<32+ chars>');
  console.log('  NODE_ENV=production');
}

function printVercelSteps(zone) {
  section('Vercel CLI (opcional)');
  console.log(`  npx vercel domains add ${zone}`);
  console.log(`  npx vercel domains add www.${zone}`);
  console.log('\nDashboard: Primary = apex; www → redirect 308 para apex.');
}

function printRailwaySteps(zone) {
  section('Railway');
  console.log(`  Custom Domain: api.${zone}`);
  console.log('  CNAME api → target mostrado no painel → aguardar SSL Active');
  console.log('  Redeploy após CORS_ORIGIN');
}

function printChecklist(zone) {
  section('Checklist');
  const items = [
    `Registro.br: A @ e CNAME www + CNAME api para ${zone}`,
    'Vercel: apex + www Valid; redirect www → apex',
    'Railway: api subdomain Active',
    'Railway CORS_ORIGIN = https://' + zone + ',https://www.' + zone,
    'Vercel API_INTERNAL_URL = https://api.' + zone,
    'npm run prod:domain:smoke',
  ];
  for (const item of items) {
    console.log(`  [ ] ${item}`);
  }
}

function runSmoke() {
  const root = path.resolve(__dirname, '..');
  const r = spawnSync('node', [path.join(__dirname, 'dev-cloud-smoke.cjs')], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  process.exit(r.status ?? 1);
}

function main() {
  const { zone, smoke } = parseArgs();

  if (smoke) {
    runSmoke();
    return;
  }

  console.log('InsureFlow — setup domínio produção');
  console.log(`Zona: ${zone}`);
  printDnsPlan(zone);
  printEnvPlan(zone);
  printVercelSteps(zone);
  printRailwaySteps(zone);
  printChecklist(zone);

  section('Smoke');
  console.log(
    `API_URL=https://api.${zone} WEB_URL=https://${zone} npm run prod:domain:smoke`,
  );
}

main();
