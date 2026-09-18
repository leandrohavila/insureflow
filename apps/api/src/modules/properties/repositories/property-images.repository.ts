import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PropertyImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PropertyImageUncheckedCreateInput) {
    return this.prisma.propertyImage.create({ data });
  }

  findOwned(tenantId: string, propertyId: string, imageId: string) {
    return this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId, tenantId },
    });
  }

  async deleteOwned(tenantId: string, propertyId: string, imageId: string) {
    const row = await this.findOwned(tenantId, propertyId, imageId);
    if (!row) return null;
    return this.prisma.propertyImage.delete({ where: { id: imageId } });
  }

  clearCover(propertyId: string) {
    return this.prisma.propertyImage.updateMany({
      where: { propertyId, isCover: true },
      data: { isCover: false },
    });
  }

  countByProperty(propertyId: string) {
    return this.prisma.propertyImage.count({ where: { propertyId } });
  }

  nextSortOrder(propertyId: string) {
    return this.prisma.propertyImage
      .aggregate({
        where: { propertyId },
        _max: { sortOrder: true },
      })
      .then((agg) => (agg._max.sortOrder ?? -1) + 1);
  }

  async setCover(tenantId: string, propertyId: string, imageId: string) {
    const row = await this.findOwned(tenantId, propertyId, imageId);
    if (!row) return null;
    await this.clearCover(propertyId);
    return this.prisma.propertyImage.update({
      where: { id: imageId },
      data: { isCover: true },
    });
  }

  reorder(propertyId: string, imageIds: string[]) {
    return this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.propertyImage.updateMany({
          where: { id, propertyId },
          data: { sortOrder: index },
        }),
      ),
    );
  }
}
