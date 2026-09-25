import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { normalizePropertyCode } from '../property-slug';
import {
  PROPERTY_DETAIL_INCLUDE,
  slugifyTitle,
  type PropertyPurpose,
  type PropertyType,
} from '../properties.util';

export type PropertyListFilters = {
  tenantId: string;
  businessUnitIds?: string[] | null;
  city?: string;
  neighborhood?: string;
  purpose?: PropertyPurpose;
  purposeMode?: 'buy' | 'rent';
  type?: PropertyType;
  priceMin?: number;
  priceMax?: number;
  published?: boolean;
  featured?: boolean;
  featuredActiveOnly?: boolean;
  isLaunch?: boolean;
  code?: string;
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
    if (filters.purposeMode === 'buy') {
      and.push({ purpose: { in: ['SALE', 'SALE_AND_RENT'] } });
    } else if (filters.purposeMode === 'rent') {
      and.push({ purpose: { in: ['RENT', 'SALE_AND_RENT'] } });
    } else if (filters.purpose) {
      and.push({ purpose: filters.purpose });
    }
    if (filters.type) {
      and.push({ type: filters.type });
    }
    if (filters.isLaunch != null) {
      and.push({ isLaunch: filters.isLaunch });
    }
    if (filters.code?.trim()) {
      const code = filters.code.trim();
      const digits = normalizePropertyCode(code);
      const codeOr: Prisma.PropertyWhereInput[] = [
        { slug: { equals: code, mode: 'insensitive' } },
        { id: code },
      ];
      if (digits) {
        codeOr.push(
          { publicCode: digits },
          { slug: { endsWith: `-cod-${digits}`, mode: 'insensitive' } },
        );
      }
      and.push({ OR: codeOr });
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
    order: 'admin' | 'catalog' = 'admin',
  ) {
    return this.prisma.property.findMany({
      where: this.where(filters),
      include: PROPERTY_DETAIL_INCLUDE,
      orderBy:
        order === 'catalog'
          ? [
              { featured: 'desc' },
              { portalOrder: 'asc' },
              { publishedAt: 'desc' },
              { createdAt: 'desc' },
            ]
          : [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
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
      where: publishedOnly
        ? {
            tenantId,
            published: true,
            OR: [{ slug }, { legacySlugs: { has: slug } }],
          }
        : { tenantId, slug },
      include: PROPERTY_DETAIL_INCLUDE,
    });
  }

  findByPublicCode(tenantId: string, rawCode: string, publishedOnly = true) {
    const code = normalizePropertyCode(rawCode);
    if (!code) return Promise.resolve(null);
    return this.prisma.property.findFirst({
      where: {
        tenantId,
        ...(publishedOnly ? { published: true } : {}),
        OR: [
          { publicCode: code },
          { slug: { endsWith: `-cod-${code}`, mode: 'insensitive' } },
        ],
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

  async isPublicCodeTaken(tenantId: string, publicCode: string, excludeId?: string) {
    const row = await this.prisma.property.findFirst({
      where: {
        tenantId,
        publicCode,
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

  async facets(
    filters: Pick<
      PropertyListFilters,
      'tenantId' | 'businessUnitIds' | 'published'
    >,
  ) {
    const rows = await this.prisma.property.groupBy({
      by: ['neighborhood', 'city', 'type'],
      where: this.where({ ...filters }),
      _count: { _all: true },
    });

    const neighborhoods = new Map<
      string,
      { name: string; city: string; slug: string; count: number }
    >();
    const cities = new Map<string, number>();
    const types = new Map<string, number>();

    for (const row of rows) {
      const count = row._count._all;
      types.set(row.type, (types.get(row.type) ?? 0) + count);
      const city = row.city.trim();
      if (city) cities.set(city, (cities.get(city) ?? 0) + count);
      const name = row.neighborhood?.trim();
      if (!name || !city) continue;
      const slug = slugifyTitle(`${name}-${city}`);
      const current = neighborhoods.get(slug);
      neighborhoods.set(slug, {
        name,
        city,
        slug,
        count: (current?.count ?? 0) + count,
      });
    }

    return {
      neighborhoods: [...neighborhoods.values()].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR'),
      ),
      cities: [...cities.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      types: [...types.entries()].map(([type, count]) => ({ type, count })),
    };
  }
}
