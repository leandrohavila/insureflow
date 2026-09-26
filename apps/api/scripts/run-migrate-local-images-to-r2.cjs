/**
 * Carrega scripts/migrate-local-images-to-r2.ts sem o tsconfig NodeNext da API.
 */
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node',
  esModuleInterop: true,
});
process.env.TS_NODE_SKIP_PROJECT = 'true';

require('ts-node/register/transpile-only');
require('../../../scripts/migrate-local-images-to-r2.ts');
