import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  PROPERTY_DETAIL_INCLUDE,
  type PropertyPurpose,
} from '../properties.util';

export type PropertyListFilters = {
  tenantId: string;
  businessUnitIds?: string[] | null;
  city?: string;
  neighborhood?: string;
  purpose?: PropertyPurpose;
  priceMin?: number;
  priceMax?: number;
  published?: boolean;
  featured?: boolean;
  featuredActiveOnly?: boolean;
  search?: string;
  q?: string;
};

@Injectable()
export class PropertiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private where(filters: PropertyListFilters): Prisma.PropertyWhereInput {
    const and: Prisma.PropertyWhereInput[] = [{ tenantId: filters.tenantId }];

    if (filters.businessUnitIds) {
      and.push({ businessUnitId: { in: filters.businessUnitIds } });
    }
    if (filters.city?.trim()) {
      and.push({
        city: { equals: filters.city.trim(), mode: 'insensitive' },
      });
    }
    if (filters.neighborhood?.trim()) {
      and.push({
        neighborhood: {
          equals: filters.neighborhood.trim(),
          mode: 'insensitive',
        },
      });
    }
    if (filters.purpose) {
      and.push({ purpose: filters.purpose });
    }
    if (filters.priceMin != null || filters.priceMax != null) {
      and.push({
        price: {
          ...(filters.priceMin != null ? { gte: filters.priceMin } : {}),
          ...(filters.priceMax != null ? { lte: filters.priceMax } : {}),
        },
      });
    }
    if (filters.published != null) {
      and.push({ published: filters.published });
    }
    if (filters.featured != null) {
      and.push({ featured: filters.featured });
    }
    if (filters.featuredActiveOnly) {
      and.push({
        OR: [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }],
      });
    }

    const term = (filters.q ?? filters.search)?.trim();
    if (term) {
      and.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { city: { contains: term, mode: 'insensitive' } },
          { neighborhood: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: and };
  }

  findMany(
    filters: PropertyListFilters,
    skip: number,
    take: number,
  ) {
    return this.prisma.property.findMany({
      where: this.where(filters),
      include: PROPERTY_DETAIL_INCLUDE,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    });
  }

  count(filters: PropertyListFilters) {
    return this.prisma.property.count({ where: this.where(filters) });
  }

  findById(tenantId: string, id: string) {
    return this.prisma.property.findFirst({
      where: { id, tenantId },
      include: PROPERTY_DETAIL_INCLUDE,
    });
  }

  findBySlug(tenantId: string, slug: string, publishedOnly = false) {
    return this.prisma.property.findFirst({
      where: {
        tenantId,
        slug,
        ...(publishedOnly ? { published: true } : {}),
      },
      include: PROPERTY_DETAIL_INCLUDE,
    });
  }

  async isSlugTaken(tenantId: string, slug: string, excludeId?: string) {
    const row = await this.prisma.property.findFirst({
      where: {
        tenantId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  create(data: Prisma.PropertyCreateInput) {
    return this.prisma.property.create({
      data,
      include: PROPERTY_DETAIL_INCLUDE,
    });
  }

  update(id: string, data: Prisma.PropertyUpdateInput) {
    return this.prisma.property.update({
      where: { id },
      data,
      include: PROPERTY_DETAIL_INCLUDE,
    });
  }

  delete(id: string) {
    return this.prisma.property.delete({ where: { id } });
  }
}
