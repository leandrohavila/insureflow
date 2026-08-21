import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STARTED_AT = new Date().toISOString();

function resolveGitCommit(cwd: string): string {
  const candidates = [
    join(cwd, '.git', 'HEAD'),
    join(cwd, '..', '.git', 'HEAD'),
    join(cwd, '..', '..', '.git', 'HEAD'),
  ];

  for (const headPath of candidates) {
    if (!existsSync(headPath)) continue;
    try {
      const head = readFileSync(headPath, 'utf8').trim();
      if (head.startsWith('ref:')) {
        const ref = head.slice(5).trim();
        const refPath = join(headPath, '..', ref);
        if (existsSync(refPath)) {
          return readFileSync(refPath, 'utf8').trim();
        }
      }
      return head;
    } catch {
      // try next
    }
  }

  try {
    return execSync('git rev-parse HEAD', {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

function resolveBuildTimestamp(cwd: string): string {
  const candidates = [
    join(cwd, 'dist/main.js'),
    join(cwd, 'apps/api/dist/main.js'),
  ];

  for (const mainJs of candidates) {
    if (!existsSync(mainJs)) continue;
    return statSync(mainJs).mtime.toISOString();
  }

  return 'watch-mode';
}

function readApiVersion(cwd: string): string {
  const candidates = [
    join(cwd, 'package.json'),
    join(cwd, 'apps/api/package.json'),
  ];

  for (const pkgPath of candidates) {
    if (!existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // try next
    }
  }

  return '0.0.0';
}

export type RuntimeKind = 'local' | 'docker' | 'production';

export function detectRuntime(): RuntimeKind {
  if (existsSync('/.dockerenv')) return 'docker';
  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production') return 'production';
  return 'local';
}

export type RuntimeInfo = {
  version: string;
  commit: string;
  startedAt: string;
  builtAt: string;
  environment: string;
  pid: number;
  port: string;
  runtime: RuntimeKind;
};

export function getRuntimeInfo(port = process.env.PORT ?? '4000'): RuntimeInfo {
  const cwd = process.cwd();

  return {
    version: readApiVersion(cwd),
    commit: resolveGitCommit(cwd),
    startedAt: STARTED_AT,
    builtAt: resolveBuildTimestamp(cwd),
    environment: process.env.NODE_ENV ?? 'development',
    pid: process.pid,
    port: String(port),
    runtime: detectRuntime(),
  };
}

export function formatRuntimeBootLine(info: RuntimeInfo): string {
  return `[boot] commit=${info.commit} builtAt=${info.builtAt} pid=${info.pid} NODE_ENV=${info.environment} PORT=${info.port} runtime=${info.runtime}`;
}
