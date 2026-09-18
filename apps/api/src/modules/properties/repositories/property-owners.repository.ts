import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const OWNER_INCLUDE = { person: true } as const;

@Injectable()
export class PropertyOwnersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProperty(tenantId: string, propertyId: string) {
    return this.prisma.propertyOwner.findMany({
      where: { tenantId, propertyId },
      include: OWNER_INCLUDE,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  findOwned(tenantId: string, propertyId: string, ownerId: string) {
    return this.prisma.propertyOwner.findFirst({
      where: { id: ownerId, tenantId, propertyId },
      include: OWNER_INCLUDE,
    });
  }

  create(data: Prisma.PropertyOwnerUncheckedCreateInput) {
    return this.prisma.propertyOwner.create({
      data,
      include: OWNER_INCLUDE,
    });
  }

  update(id: string, data: Prisma.PropertyOwnerUncheckedUpdateInput) {
    return this.prisma.propertyOwner.update({
      where: { id },
      data,
      include: OWNER_INCLUDE,
    });
  }

  delete(id: string) {
    return this.prisma.propertyOwner.delete({ where: { id } });
  }

  clearPrimary(propertyId: string) {
    return this.prisma.propertyOwner.updateMany({
      where: { propertyId, isPrimary: true },
      data: { isPrimary: false },
    });
  }
}
