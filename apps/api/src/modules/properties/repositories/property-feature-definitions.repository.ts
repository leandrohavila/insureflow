import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PropertyFeatureDefinitionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, activeOnly = false) {
    return this.prisma.propertyFeatureDefinition.findMany({
      where: { tenantId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  findById(tenantId: string, id: string) {
    return this.prisma.propertyFeatureDefinition.findFirst({
      where: { id, tenantId },
    });
  }

  findByKey(tenantId: string, key: string, excludeId?: string) {
    return this.prisma.propertyFeatureDefinition.findFirst({
      where: {
        tenantId,
        key,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  create(data: Prisma.PropertyFeatureDefinitionUncheckedCreateInput) {
    return this.prisma.propertyFeatureDefinition.create({ data });
  }

  update(id: string, data: Prisma.PropertyFeatureDefinitionUncheckedUpdateInput) {
    return this.prisma.propertyFeatureDefinition.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.propertyFeatureDefinition.delete({ where: { id } });
  }
}
