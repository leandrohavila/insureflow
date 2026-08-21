/**
 * Garante que pacotes workspace compilados existam antes de api start/build.
 * Evita ERR_MODULE_NOT_FOUND ao resolver exports apontando para dist/.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const WORKSPACE_PACKAGES = [
  {
    name: '@repo/forms-engine',
    distEntry: 'packages/forms-engine/dist/index.js',
  },
  {
    name: '@repo/forms-library',
    distEntry: 'packages/forms-library/dist/index.js',
  },
];

function runBuild(workspaceName) {
  const result = spawnSync('npm', ['run', 'build', '-w', workspaceName], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  for (const pkg of WORKSPACE_PACKAGES) {
    const distPath = path.join(root, pkg.distEntry);
    if (fs.existsSync(distPath)) continue;
    console.log(`[ensure-workspace-packages] Building ${pkg.name} (missing ${pkg.distEntry})`);
    runBuild(pkg.name);
  }
}

main();
