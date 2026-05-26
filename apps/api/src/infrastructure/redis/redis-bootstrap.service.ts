import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import {
  buildRedisConnection,
  maskRedisUrl,
} from './redis-connection.util';

export type RedisRuntimeStatus = {
  ok: boolean;
  label: string;
  maskedUrl: string;
  error?: string;
  checkedAt: string;
};

@Injectable()
export class RedisBootstrapService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(RedisBootstrapService.name);
  private client: Redis | null = null;
  private status: RedisRuntimeStatus = {
    ok: false,
    label: '(pending)',
    maskedUrl: '(pending)',
    checkedAt: new Date().toISOString(),
  };

  constructor(private readonly cfg: ConfigService) {}

  getRuntimeStatus(): RedisRuntimeStatus {
    return this.status;
  }

  async onModuleInit(): Promise<void> {
    const redisUrl = this.cfg.get<string>('REDIS_URL');
    const parsed = buildRedisConnection({
      redisUrl,
      host: this.cfg.get<string>('REDIS_HOST'),
      port: this.cfg.get<number>('REDIS_PORT'),
    });

    this.status = {
      ok: false,
      label: parsed.label,
      maskedUrl: maskRedisUrl(redisUrl),
      checkedAt: new Date().toISOString(),
    };

    if (parsed.isLocalhost && process.env.NODE_ENV === 'production') {
      this.log.error(
        `[redis] REDIS aponta para localhost (${parsed.label}) em produção — BullMQ falhará com ECONNREFUSED. ` +
          'No Railway: Variables → REDIS_URL = ${{Redis.REDIS_URL}} (serviço Redis do projeto).',
      );
    }

    this.log.log(`[redis] Configurado ${parsed.label} (${maskRedisUrl(redisUrl)})`);

    this.client = new Redis({
      ...parsed.ioredis,
      maxRetriesPerRequest: 1,
      connectTimeout: 8000,
      lazyConnect: true,
    });

    try {
      await this.client.connect();
      const pong = await this.client.ping();
      this.status = {
        ok: pong === 'PONG',
        label: parsed.label,
        maskedUrl: maskRedisUrl(redisUrl),
        checkedAt: new Date().toISOString(),
      };
      if (this.status.ok) {
        this.log.log(`[redis] Conexão OK (PING ${pong}) — filas BullMQ podem subir`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      this.status = {
        ok: false,
        label: parsed.label,
        maskedUrl: maskRedisUrl(redisUrl),
        error: code ? `${code}: ${message}` : message,
        checkedAt: new Date().toISOString(),
      };
      this.log.error(
        `[redis] Falha na conexão (${parsed.label}): ${this.status.error}. ` +
          'Auditoria em fila pode falhar até REDIS_URL ser corrigida.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
      this.client = null;
    }
  }
}
