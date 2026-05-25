/**
 * postinstall: gera Prisma Client com retry (Windows EPERM quando o engine está em uso).
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const maxAttempts = 4;
const retryDelayMs = 2500;

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

  const retriable =
    attempt < maxAttempts &&
    (result.status === 1 || result.status === null);

  if (retriable) {
    console.warn(
      `[postinstall] prisma generate falhou (tentativa ${attempt}/${maxAttempts}); aguardando ${retryDelayMs}ms...`,
    );
    console.warn(
      '[postinstall] Se persistir: pare processos que usam node_modules/.prisma (ex.: docker compose stop api).',
    );
    sleep(retryDelayMs);
    runGenerate(attempt + 1);
    return;
  }

  process.exit(result.status ?? 1);
}

runGenerate(1);
