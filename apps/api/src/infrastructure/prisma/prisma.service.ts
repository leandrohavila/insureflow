import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.log.log('[prisma] Conexão Neon/PostgreSQL OK');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
