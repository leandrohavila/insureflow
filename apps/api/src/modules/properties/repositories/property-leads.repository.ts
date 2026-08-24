import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PropertyLeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PropertyLeadUncheckedCreateInput) {
    return this.prisma.propertyLead.create({ data });
  }

  findByProperty(tenantId: string, propertyId: string) {
    return this.prisma.propertyLead.findMany({
      where: { tenantId, propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
