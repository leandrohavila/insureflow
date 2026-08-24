import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CreatePublicPropertyLeadDto } from './dto/property-lead.dto';
import { PublicCatalogContextService } from './public-catalog-context.service';
import { PropertiesRepository } from './repositories/properties.repository';
import { PropertyLeadsRepository } from './repositories/property-leads.repository';

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
    if (!dto.propertyId?.trim() && !dto.propertySlug?.trim()) {
      throw new BadRequestException('Informe propertyId ou propertySlug');
    }

    const ctx = await this.context.resolve(dto);
    const property = dto.propertyId
      ? await this.properties.findById(ctx.tenantId, dto.propertyId)
      : await this.properties.findBySlug(ctx.tenantId, dto.propertySlug!, true);

    if (!property || !property.published) {
      throw new NotFoundException('Imóvel não encontrado');
    }
    if (ctx.businessUnitId && property.businessUnitId !== ctx.businessUnitId) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    return this.leads.create({
      tenantId: ctx.tenantId,
      businessUnitId: property.businessUnitId,
      propertyId: property.id,
      name: dto.name.trim(),
      email: dto.email?.trim() || null,
      phone: dto.phone?.trim() || null,
      message: dto.message?.trim() || null,
      source: 'public_portal',
    });
  }
}
