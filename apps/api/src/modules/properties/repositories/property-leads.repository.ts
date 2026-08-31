import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const INBOX_PROPERTY_SELECT = {
  id: true,
  title: true,
  slug: true,
} as const;

@Injectable()
export class PropertyLeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PropertyLeadUncheckedCreateInput) {
    return this.prisma.propertyLead.create({ data });
  }

  findByProperty(tenantId: string, propertyId: string) {
    return this.prisma.propertyLead.findMany({
      where: { tenantId, propertyId },
      include: { property: { select: INBOX_PROPERTY_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findInbox(tenantId: string, businessUnitIds?: string[]) {
    return this.prisma.propertyLead.findMany({
      where: {
        tenantId,
        ...(businessUnitIds ? { businessUnitId: { in: businessUnitIds } } : {}),
      },
      include: { property: { select: INBOX_PROPERTY_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
