import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { LeadsService } from '../leads/leads.service';
import type { CreatePublicPropertyLeadDto } from './dto/property-lead.dto';
import { PublicCatalogContextService } from './public-catalog-context.service';
import { PropertiesRepository } from './repositories/properties.repository';
import { PropertyLeadsRepository } from './repositories/property-leads.repository';
import { sanitizePropertyLeadMetadata } from './property-leads.util';

function portalLeadNotes(
  property: { title: string; slug: string } | null,
  message?: string | null,
) {
  const lines = property
    ? [`Imóvel: ${property.title}`, `URL: /imoveis/${property.slug}`]
    : ['Interesse geral no portal'];
  const text = message?.trim();
  if (text) lines.push(text);
  return lines.join('\n').slice(0, 1000);
}

@Injectable()
export class PropertyLeadsService {
  private readonly logger = new Logger(PropertyLeadsService.name);

  constructor(
    private readonly context: PublicCatalogContextService,
    private readonly properties: PropertiesRepository,
    private readonly leads: PropertyLeadsRepository,
    @Optional() private readonly crmLeads?: LeadsService,
    @Optional() private readonly activityEngine?: ActivityEngineService,
    @Optional() private readonly prisma?: PrismaService,
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
    let property: {
      id: string;
      title: string;
      slug: string;
      published: boolean;
      businessUnitId: string;
    } | null = null;

    if (hasProperty) {
      property = propertyId
        ? await this.properties.findById(ctx.tenantId, propertyId)
        : await this.properties.findBySlug(ctx.tenantId, propertySlug!, true);

      if (!property || !property.published) {
        throw new NotFoundException('Imóvel não encontrado');
      }
      if (
        ctx.businessUnitId &&
        property.businessUnitId !== ctx.businessUnitId
      ) {
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

    const propertyLead = await this.leads.create({
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

    if (this.crmLeads) {
      try {
        const crmLead = await this.crmLeads.createLead(ctx.tenantId, {
          name: dto.name.trim(),
          email: dto.email?.trim() || undefined,
          phone: dto.phone?.trim() || undefined,
          source: dto.source?.trim() || 'public_portal',
          notes: portalLeadNotes(property, dto.message),
          businessUnitId,
          interestCategories: ['PROPERTY_BUY'],
        });
        const crmLeadId = crmLead?.id;
        if (crmLeadId) {
          await this.leads.linkCrmLead(propertyLead.id, crmLeadId);
          await this.recordPortalLeadActivity({
            tenantId: ctx.tenantId,
            businessUnitId,
            crmLeadId,
            propertyLeadId: propertyLead.id,
            name: dto.name.trim(),
            source: dto.source?.trim() || 'public_portal',
            notes: portalLeadNotes(property, dto.message),
          });
        }
      } catch (error) {
        this.logger.warn(
          `Portal lead ${propertyLead.id} não espelhado no CRM: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return propertyLead;
  }

  /**
   * O cadastro público não tem usuário autenticado. A Activity exige
   * performedById, então o responsável é um usuário ativo da unidade
   * (ou o primeiro usuário ativo do tenant).
   */
  private async recordPortalLeadActivity(input: {
    tenantId: string;
    businessUnitId: string;
    crmLeadId: string;
    propertyLeadId: string;
    name: string;
    source: string;
    notes: string;
  }) {
    if (!this.activityEngine || !this.prisma) return;

    try {
      const performedById = await this.resolvePortalPerformer(
        input.tenantId,
        input.businessUnitId,
      );
      if (!performedById) {
        this.logger.warn(
          `Portal lead ${input.propertyLeadId} sem usuário para registrar Activity`,
        );
        return;
      }

      await this.activityEngine.publish({
        tenantId: input.tenantId,
        performedById,
        operationalEventKind: 'portal_lead_received',
        subject: `Interesse no portal — ${input.name}`,
        description: input.notes,
        leadId: input.crmLeadId,
        occurredAt: new Date(),
        metadata: {
          source: input.source,
          propertyLeadId: input.propertyLeadId,
        },
        idempotencyKey: {
          operationalEventKind: 'portal_lead_received',
          leadId: input.crmLeadId,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Activity do portal lead ${input.propertyLeadId} não gravada: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async resolvePortalPerformer(
    tenantId: string,
    businessUnitId: string,
  ) {
    const linked = await this.prisma!.user.findFirst({
      where: {
        tenantId,
        isActive: true,
        businessUnits: { some: { businessUnitId } },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (linked) return linked.id;

    const fallback = await this.prisma!.user.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return fallback?.id ?? null;
  }
}
