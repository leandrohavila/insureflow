import { Injectable } from '@nestjs/common';

import { defaultStagesForUnitType } from '../../common/utils/deal-pipeline.util';
import type { BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';

@Injectable()
export class PipelinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buAccess: BusinessUnitAccessService,
  ) {}

  async list(tenantId: string, actor?: BusinessUnitActor) {
    await this.ensureTenantPipelines(tenantId);
    const ids = actor ? await this.buAccess.resolveIds(actor) : null;
    const pipelines = await this.prisma.businessUnitPipeline.findMany({
      where: {
        tenantId,
        ...(ids ? { businessUnitId: { in: ids } } : {}),
        ...(ids && ids.length === 0 ? { id: { in: [] } } : {}),
      },
      include: pipelineInclude,
      orderBy: { name: 'asc' },
    });
    return pipelines.map(serializePipeline);
  }

  async ensureTenantPipelines(tenantId: string) {
    const units = await this.prisma.businessUnit.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, type: true, name: true },
    });
    for (const unit of units) {
      await this.ensureForBusinessUnit(tenantId, unit);
    }
  }

  async ensureForBusinessUnit(
    tenantId: string,
    unit: { id: string; type: 'INSURANCE' | 'REAL_ESTATE'; name?: string },
  ) {
    const existing = await this.prisma.businessUnitPipeline.findUnique({
      where: { businessUnitId: unit.id },
      include: pipelineInclude,
    });
    if (existing) {
      await this.prisma.deal.updateMany({
        where: { tenantId, businessUnitId: unit.id, pipelineId: null },
        data: { pipelineId: existing.id },
      });
      return existing;
    }

    const created = await this.prisma.businessUnitPipeline.create({
      data: {
        tenantId,
        businessUnitId: unit.id,
        name:
          unit.type === 'REAL_ESTATE'
            ? `Pipeline Imobiliária — ${unit.name ?? ''}`.trim()
            : `Pipeline Seguros — ${unit.name ?? ''}`.trim(),
        stages: {
          create: defaultStagesForUnitType(unit.type).map((stage) => ({
            slug: stage.slug,
            label: stage.label,
            sortOrder: stage.sortOrder,
            maxDays: stage.maxDays,
            alertTarget: stage.alertTarget,
            color: stage.color,
          })),
        },
      },
      include: pipelineInclude,
    });
    await this.prisma.deal.updateMany({
      where: { tenantId, businessUnitId: unit.id, pipelineId: null },
      data: { pipelineId: created.id },
    });
    return created;
  }

  async resolveForDeal(tenantId: string, businessUnitId?: string | null) {
    if (!businessUnitId) return null;
    const unit = await this.prisma.businessUnit.findFirst({
      where: { id: businessUnitId, tenantId },
      select: { id: true, type: true, name: true },
    });
    if (!unit) return null;
    return this.ensureForBusinessUnit(tenantId, unit);
  }
}

const pipelineInclude = {
  businessUnit: {
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  },
  stages: { orderBy: { sortOrder: 'asc' as const } },
};

export function serializePipeline(
  row: Awaited<ReturnType<PipelinesService['ensureForBusinessUnit']>>,
) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    businessUnit: row.businessUnit,
    stages: row.stages.map((stage) => ({
      id: stage.id,
      slug: stage.slug,
      label: stage.label,
      sortOrder: stage.sortOrder,
      maxDays: stage.maxDays,
      alertTarget: stage.alertTarget,
      color: stage.color,
    })),
  };
}
