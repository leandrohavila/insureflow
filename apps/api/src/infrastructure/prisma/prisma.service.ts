import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma gerado pelo pacote @repo/database.
 * Rode `npm run db:generate` na raiz (ou build do database) antes do build da API.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly log = new Logger(PrismaService.name);

  constructor() {
    super({ log: [{ emit: 'event', level: 'query' }] });
    (
      this as unknown as {
        $on: (
          event: 'query',
          callback: (event: Prisma.QueryEvent) => void,
        ) => void;
      }
    ).$on('query', (event) => {
      if (!/"?(leads|activities)"?/i.test(event.query)) return;
      this.log.log(
        `[BUG010.2][prisma-sql] durationMs=${event.duration} query=${event.query} params=${event.params}`,
      );
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.log.log('[prisma] Conexão Neon/PostgreSQL OK');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
