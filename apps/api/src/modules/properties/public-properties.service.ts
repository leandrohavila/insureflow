import { Injectable, NotFoundException } from '@nestjs/common';

import type {
  PublicPropertyQueryDto,
  PublicPropertySearchQueryDto,
} from './dto/public-property.dto';
import { PublicCatalogContextService } from './public-catalog-context.service';
import { PropertiesRepository } from './repositories/properties.repository';
import { serializePublicProperty } from './properties.util';

@Injectable()
export class PublicPropertiesService {
  constructor(
    private readonly context: PublicCatalogContextService,
    private readonly properties: PropertiesRepository,
  ) {}

  private filters(
    ctx: { tenantId: string; businessUnitId?: string },
    query: PublicPropertyQueryDto & { q?: string },
    extras?: { featured?: boolean; featuredActiveOnly?: boolean },
  ) {
    return {
      tenantId: ctx.tenantId,
      businessUnitIds: ctx.businessUnitId ? [ctx.businessUnitId] : undefined,
      city: query.city,
      neighborhood: query.neighborhood,
      purpose: query.purpose,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      published: true as const,
      featured: extras?.featured,
      featuredActiveOnly: extras?.featuredActiveOnly,
      q: query.q,
    };
  }

  async list(query: PublicPropertyQueryDto) {
    const ctx = await this.context.resolve(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const filters = this.filters(ctx, query);
    const [rows, total] = await Promise.all([
      this.properties.findMany(filters, (page - 1) * limit, limit),
      this.properties.count(filters),
    ]);
    return {
      data: rows.map((row) => serializePublicProperty(row)),
      total,
      page,
      limit,
    };
  }

  async search(query: PublicPropertySearchQueryDto) {
    return this.list(query);
  }

  async highlights(query: PublicPropertyQueryDto) {
    const ctx = await this.context.resolve(query);
    const limit = query.limit ?? 12;
    const filters = this.filters(ctx, query, {
      featured: true,
      featuredActiveOnly: true,
    });
    const rows = await this.properties.findMany(filters, 0, limit);
    return { data: rows.map((row) => serializePublicProperty(row)) };
  }

  async findBySlug(slug: string, query: PublicPropertyQueryDto) {
    const ctx = await this.context.resolve(query);
    const row = await this.properties.findBySlug(ctx.tenantId, slug, true);
    if (!row) throw new NotFoundException('Imóvel não encontrado');
    if (ctx.businessUnitId && row.businessUnitId !== ctx.businessUnitId) {
      throw new NotFoundException('Imóvel não encontrado');
    }
    return serializePublicProperty(row);
  }
}
