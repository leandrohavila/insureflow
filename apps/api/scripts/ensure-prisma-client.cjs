/**
 * Garante Prisma Client alinhado ao schema antes do build/dev da API.
 * Evita falha de compilação (leads/questionnaires/customers) quando o client está desatualizado.
 * Pula generate se os delegates já existem; usa retry em EPERM (Windows).
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const clientTypes = path.join(
  root,
  'node_modules',
  '.prisma',
  'client',
  'index.d.ts',
);

const requiredDelegates = [
  'get lead():',
  'get questionnaireTemplate():',
  'get customer():',
  'get policy():',
];

const requiredActivityFields = ['policyId: string | null', 'policyId?: boolean'];

/** Deal.pipelineOrder — Kanban; ausente quando o client foi gerado antes da migration. */
const requiredDealFields = ['pipelineOrder: number', 'readonly pipelineOrder: FieldRef<"Deal"'];

function clientLooksComplete() {
  if (!fs.existsSync(clientTypes)) {
    return false;
  }
  const content = fs.readFileSync(clientTypes, 'utf8');
  const delegatesOk = requiredDelegates.every((marker) => content.includes(marker));
  const dealPipelineOrderOk = requiredDealFields.every((marker) =>
    content.includes(marker),
  );
  const activityPolicyIdOk = requiredActivityFields.some((marker) =>
    content.includes(marker),
  );
  return delegatesOk && dealPipelineOrderOk && activityPolicyIdOk;
}

function sleep(ms) {
  spawnSync('node', ['-e', `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${ms})`], {
    stdio: 'ignore',
    shell: true,
  });
}

function runGenerate(attempt) {
  const result = spawnSync('npm', ['run', 'build', '-w', '@repo/database'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.status === 0) {
    return;
  }

  if (attempt < 4) {
    console.warn(
      `[ensure-prisma-client] prisma generate falhou (tentativa ${attempt}/4); aguardando 2.5s...`,
    );
    console.warn(
      '[ensure-prisma-client] Pare a API se o erro for EPERM (engine em uso).',
    );
    sleep(2500);
    runGenerate(attempt + 1);
    return;
  }

  if (clientLooksComplete()) {
    console.warn(
      '[ensure-prisma-client] generate falhou, mas o client já contém os modelos necessários; continuando.',
    );
    return;
  }

  process.exit(result.status ?? 1);
}

if (clientLooksComplete()) {
  process.exit(0);
}

console.log('[ensure-prisma-client] Prisma Client desatualizado; executando generate...');
runGenerate(1);

if (!clientLooksComplete()) {
  console.error(
    '[ensure-prisma-client] Cliente ainda incompleto após generate. Rode `npm run db:generate` na raiz com a API parada.',
  );
  process.exit(1);
}
