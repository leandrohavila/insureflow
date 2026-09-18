/**
 * Release entrypoint: migrate deploy + start API.
 * Usado por Railway / Docker em produção.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const apiRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(apiRoot, '../..');

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('[start-release] Running prisma migrate deploy...');
run('npm', ['run', 'db:deploy', '-w', '@repo/database'], monorepoRoot);

console.log('[start-release] Starting API...');
run('node', ['dist/main.js'], apiRoot);
