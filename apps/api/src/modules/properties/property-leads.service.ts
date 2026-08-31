import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import type { CreatePublicPropertyLeadDto } from './dto/property-lead.dto';
import { PublicCatalogContextService } from './public-catalog-context.service';
import { PropertiesRepository } from './repositories/properties.repository';
import { PropertyLeadsRepository } from './repositories/property-leads.repository';
import { sanitizePropertyLeadMetadata } from './property-leads.util';

@Injectable()
export class PropertyLeadsService {
  constructor(
    private readonly context: PublicCatalogContextService,
    private readonly properties: PropertiesRepository,
    private readonly leads: PropertyLeadsRepository,
  ) {}

  async createPublic(dto: CreatePublicPropertyLeadDto) {
    if (!dto.email?.trim() && !dto.phone?.trim()) {
      throw new BadRequestException('Informe e-mail ou telefone');
    }

    const ctx = await this.context.resolve(dto);
    const propertyId = dto.propertyId?.trim() || undefined;
    const propertySlug = dto.propertySlug?.trim() || undefined;
    const hasProperty = Boolean(propertyId || propertySlug);

    let resolvedPropertyId: string | null = null;
    let businessUnitId: string;

    if (hasProperty) {
      const property = propertyId
        ? await this.properties.findById(ctx.tenantId, propertyId)
        : await this.properties.findBySlug(ctx.tenantId, propertySlug!, true);

      if (!property || !property.published) {
        throw new NotFoundException('Imóvel não encontrado');
      }
      if (ctx.businessUnitId && property.businessUnitId !== ctx.businessUnitId) {
        throw new NotFoundException('Imóvel não encontrado');
      }

      resolvedPropertyId = property.id;
      businessUnitId = property.businessUnitId;
    } else {
      if (!ctx.businessUnitId) {
        throw new BadRequestException('Informe a unidade de negócio');
      }
      businessUnitId = ctx.businessUnitId;
    }

    return this.leads.create({
      tenantId: ctx.tenantId,
      businessUnitId,
      propertyId: resolvedPropertyId,
      name: dto.name.trim(),
      email: dto.email?.trim() || null,
      phone: dto.phone?.trim() || null,
      message: dto.message?.trim() || null,
      source: dto.source?.trim() || 'public_portal',
      metadata: sanitizePropertyLeadMetadata(dto.metadata) ?? Prisma.DbNull,
    });
  }
}
