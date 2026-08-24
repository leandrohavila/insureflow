import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PersonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, search?: string) {
    const term = search?.trim();
    return this.prisma.person.findMany({
      where: {
        tenantId,
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { document: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 100,
    });
  }

  findById(tenantId: string, id: string) {
    return this.prisma.person.findFirst({ where: { id, tenantId } });
  }

  create(data: Prisma.PersonUncheckedCreateInput) {
    return this.prisma.person.create({ data });
  }

  update(id: string, data: Prisma.PersonUncheckedUpdateInput) {
    return this.prisma.person.update({ where: { id }, data });
  }
}
