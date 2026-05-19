/**
 * Reexporta o Prisma Client gerado a partir de packages/database/prisma/schema.prisma.
 * Rode `npm run db:generate` na raiz após alterar o schema.
 */
export { Prisma, PrismaClient } from '@prisma/client';
export type * from '@prisma/client';
