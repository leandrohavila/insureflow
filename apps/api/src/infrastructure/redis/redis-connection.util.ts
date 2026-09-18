import type { ConnectionOptions } from 'bullmq';

export type IoredisTcpOptions = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
  maxRetriesPerRequest?: number | null;
};

export type ParsedRedisConfig = {
  connection: ConnectionOptions;
  ioredis: IoredisTcpOptions;
  /** Host:port sem credenciais — seguro para logs */
  label: string;
  usesTls: boolean;
  isLocalhost: boolean;
};

export function maskRedisUrl(raw?: string): string {
  if (!raw?.trim()) return '(not set)';
  try {
    const u = new URL(raw);
    const user = u.username ? `${u.username}:***@` : '';
    return `${u.protocol}//${user}${u.hostname}:${u.port || '6379'}`;
  } catch {
    return '(invalid REDIS_URL)';
  }
}

export function isLocalRedisTarget(host: string): boolean {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

/**
 * BullMQ / ioredis connection from REDIS_URL or REDIS_HOST/PORT.
 * Suporta redis:// e rediss:// (TLS no Railway em alguns planos).
 */
export function buildRedisConnection(cfg: {
  redisUrl?: string;
  host?: string;
  port?: number;
}): ParsedRedisConfig {
  const redisUrl = cfg.redisUrl?.trim();
  if (redisUrl) {
    const u = new URL(redisUrl);
    const host = u.hostname;
    const port = parseInt(u.port || '6379', 10);
    const usesTls = u.protocol === 'rediss:';
    const ioredis: IoredisTcpOptions = {
      host,
      port,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      username: u.username ? decodeURIComponent(u.username) : undefined,
      ...(usesTls ? { tls: {} } : {}),
    };
    const connection: ConnectionOptions = {
      ...ioredis,
      maxRetriesPerRequest: null,
    };
    return {
      connection,
      ioredis,
      label: `${host}:${port}${usesTls ? ' (TLS)' : ''}`,
      usesTls,
      isLocalhost: isLocalRedisTarget(host),
    };
  }

  const host = cfg.host ?? '127.0.0.1';
  const port = cfg.port ?? 6379;
  const ioredis: IoredisTcpOptions = { host, port };
  return {
    connection: { ...ioredis, maxRetriesPerRequest: null },
    ioredis,
    label: `${host}:${port}`,
    usesTls: false,
    isLocalhost: isLocalRedisTarget(host),
  };
}
