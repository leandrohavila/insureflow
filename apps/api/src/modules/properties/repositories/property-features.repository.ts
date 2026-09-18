import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PropertyFeaturesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProperty(tenantId: string, propertyId: string) {
    return this.prisma.propertyFeature.findMany({
      where: { tenantId, propertyId },
      include: { definition: true },
    });
  }

  deleteByProperty(propertyId: string) {
    return this.prisma.propertyFeature.deleteMany({ where: { propertyId } });
  }

  createMany(data: Prisma.PropertyFeatureCreateManyInput[]) {
    if (!data.length) return Promise.resolve({ count: 0 });
    return this.prisma.propertyFeature.createMany({ data });
  }
}
